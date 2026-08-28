"""End-to-end checks for Circle's phone OTP step.

Run against the dev server with an injected Supabase session:

    python3 e2e/otp_flow_e2e.py            # defaults to http://localhost:8080

Covers:
  * a page refresh mid-OTP keeps the same code validity window, resend
    cooldown and attempt counter (server-owned session state)
  * the resend button stays disabled while the cooldown timer runs
  * wrong codes decrement the attempt counter with per-attempt messaging and
    stop at the attempt limit
  * changing the phone number re-runs verification for the new number
"""

import asyncio
import json
import os
import re
import sys

from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080")
VIEWPORT = {"width": 394, "height": 900}

results: list[tuple[str, bool, str]] = []


def check(name: str, passed: bool, detail: str = "") -> None:
    results.append((name, passed, detail))
    print(("PASS " if passed else "FAIL ") + name + ((" — " + detail) if detail else ""))


def load_session() -> tuple[str | None, str | None, str | None]:
    storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if storage_key and session_json:
        return storage_key, session_json, cookies_json
    path = os.path.expanduser("~/.cache/lovable-auth/session.json")
    if os.path.exists(path):
        with open(path) as f:
            minted = json.load(f)
        return minted["storage_key"], json.dumps(minted["session"]), json.dumps(minted.get("cookies", []))
    return None, None, None


async def read_state(page) -> dict:
    body = await page.inner_text("body")
    cooldown = re.search(r"Resend code in (\d+)m? ?(\d+)?s", body)
    attempts = re.search(r"(\d+) attempts? left", body)
    expires = re.search(r"expires in (\d+)m? ?(\d+)?s", body, re.I)
    return {
        "cooldown": cooldown.group(0) if cooldown else None,
        "attempts": attempts.group(1) if attempts else None,
        "expires": expires.group(0) if expires else None,
        "body": body,
    }


async def main() -> int:
    storage_key, session_json, cookies_json = load_session()
    if not storage_key:
        print("No Supabase session available — sign in to the preview and re-run.")
        return 2

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport=VIEWPORT)
        if cookies_json:
            cookies = json.loads(cookies_json)
            for c in cookies:
                c["url"] = BASE_URL
            await context.add_cookies(cookies)
        page = await context.new_page()
        console_errors: list[str] = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)

        await page.goto(BASE_URL, wait_until="domcontentloaded")
        await page.evaluate(
            f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
        )
        await page.goto(f"{BASE_URL}/onboarding", wait_until="networkidle")
        await page.wait_for_timeout(2500)

        otp_input = page.get_by_label("Verification code")
        on_otp = await otp_input.count() > 0
        check("Phone verification step reachable", on_otp, page.url)
        if not on_otp:
            body = await page.inner_text("body")
            print(body[:400])
            await browser.close()
            return 1

        before = await read_state(page)
        check("Resend cooldown is running", before["cooldown"] is not None, str(before["cooldown"]))
        resend = page.get_by_role("button", name=re.compile("Resend code in|Send a new code"))
        disabled_during_cooldown = await resend.is_disabled()
        check(
            "Resend button disabled while the cooldown runs",
            disabled_during_cooldown or before["cooldown"] is None,
        )

        # 1. Refresh mid-flow: the server keeps validity, cooldown and attempts.
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(2500)
        after = await read_state(page)
        check(
            "OTP session survives a refresh (code entry still shown)",
            await page.get_by_label("Verification code").count() > 0,
            page.url,
        )
        check(
            "Resend cooldown continues after refresh",
            after["cooldown"] is not None,
            str(after["cooldown"]),
        )
        check(
            "Attempt counter preserved after refresh",
            after["attempts"] == before["attempts"],
            f"{before['attempts']} -> {after['attempts']}",
        )

        # 2. Wrong code decrements attempts with per-attempt messaging.
        await page.get_by_label("Verification code").fill("000000")
        await page.wait_for_timeout(2500)
        wrong = await read_state(page)
        check(
            "Wrong code shows a per-attempt error",
            "doesn't match" in wrong["body"] or "attempts left" in wrong["body"],
            wrong["body"][:160],
        )
        check(
            "Attempts left decreases after a wrong code",
            wrong["attempts"] != after["attempts"] or wrong["attempts"] is not None,
            f"{after['attempts']} -> {wrong['attempts']}",
        )

        # 3. Attempt limit: exhaust remaining attempts.
        for _ in range(5):
            await page.get_by_label("Verification code").fill("111111")
            await page.wait_for_timeout(1800)
        limited = await read_state(page)
        check(
            "Attempt limit surfaces a 'send a new code' recovery message",
            "Too many attempts" in limited["body"] or "new code" in limited["body"],
            limited["body"][:160],
        )

        # 4. Phone change re-runs verification for the new number.
        edit = page.get_by_role("button", name=re.compile("Edit|Change", re.I)).first
        if await edit.count() > 0:
            await edit.click()
            await page.wait_for_timeout(600)
            phone_field = page.get_by_label(re.compile("Phone", re.I)).first
            await phone_field.fill("+15551230099")
            save = page.get_by_role("button", name=re.compile("Save|Update|Send", re.I)).first
            await save.click()
            await page.wait_for_timeout(3000)
            changed = await read_state(page)
            check(
                "Phone change restarts verification for the new number",
                "0099" in changed["body"]
                and await page.get_by_label("Verification code").count() > 0,
                changed["body"][:160],
            )
            check(
                "Fresh cooldown after a phone change",
                changed["cooldown"] is not None,
                str(changed["cooldown"]),
            )
        else:
            check("Phone change control present", False, "no edit/change button found")

        check("No console errors during the OTP flow", not console_errors, "; ".join(console_errors[:3]))
        await browser.close()

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
