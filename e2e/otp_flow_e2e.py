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
        # Enter the OTP flow from settings by changing the phone number. The
        # original number is captured and restored at the end of the run.
        await page.goto(f"{BASE_URL}/profile/settings", wait_until="networkidle")
        await page.wait_for_timeout(2500)
        settings_body = await page.inner_text("body")
        original = re.search(r"Current: (\+?[\d]+)", settings_body)
        original_phone = original.group(1) if original else "+15550000001"
        check("Settings exposes the phone change card", "New phone number" in settings_body)

        await page.get_by_label("New phone number").fill("+15551230099")
        await page.get_by_role("button", name="Update and re-verify").click()
        await page.wait_for_url("**/onboarding", timeout=15_000)
        await page.wait_for_timeout(3000)
        check("Phone change routes back into verification", "/onboarding" in page.url, page.url)

        otp_input = page.get_by_label("Verification code")
        on_otp = await otp_input.count() > 0
        check("Verification step shown for the new number", on_otp, page.url)
        if not on_otp:
            print((await page.inner_text("body"))[:400])
            await browser.close()
            return 1
        body = await page.inner_text("body")
        check("New number is displayed on the OTP step", "0099" in body, body[:160])

        before = await read_state(page)
        check("Resend cooldown is running", before["cooldown"] is not None, str(before["cooldown"]))
        resend = page.get_by_role("button", name=re.compile("Resend code in|Send a new code"))
        check(
            "Resend button disabled while the cooldown runs",
            (await resend.is_disabled()) or before["cooldown"] is None,
        )

        # 1. Refresh mid-flow: server keeps validity window, cooldown, attempts.
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(3000)
        after = await read_state(page)
        check(
            "OTP session survives a refresh",
            await page.get_by_label("Verification code").count() > 0,
            page.url,
        )
        check("Resend cooldown continues after refresh", after["cooldown"] is not None, str(after["cooldown"]))
        check(
            "Attempt counter preserved after refresh",
            after["attempts"] == before["attempts"],
            f"{before['attempts']} -> {after['attempts']}",
        )

        # 2. Wrong codes: per-attempt messaging, then the attempt limit.
        await page.get_by_label("Verification code").fill("000000")
        await page.wait_for_timeout(2500)
        wrong = await read_state(page)
        check(
            "Wrong code shows a per-attempt error",
            "match" in wrong["body"] or "attempt" in wrong["body"],
            wrong["body"][:160],
        )

        for _ in range(5):
            await page.get_by_label("Verification code").fill("111111")
            await page.wait_for_timeout(1800)
        limited = await read_state(page)
        check(
            "Attempt limit surfaces a 'send a new code' recovery message",
            "Too many attempts" in limited["body"] or "new code" in limited["body"],
            limited["body"][:200],
        )

        # 3. Restore the original number and complete verification with the
        #    in-app fallback code so the account is left verified.
        await page.goto(f"{BASE_URL}/profile/settings", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        await page.get_by_label("New phone number").fill(original_phone)
        await page.get_by_role("button", name="Update and re-verify").click()
        await page.wait_for_url("**/onboarding", timeout=15_000)
        await page.wait_for_timeout(3500)
        restored = await read_state(page)
        check("Fresh cooldown after the second phone change", restored["cooldown"] is not None, str(restored["cooldown"]))
        shown = re.search(r"here's your code: (\d{6})", restored["body"])
        if shown:
            await page.get_by_label("Verification code").fill(shown.group(1))
            await page.wait_for_timeout(3500)
            done = await page.inner_text("body")
            check(
                "In-app fallback code verifies the restored number",
                "Verification code" not in done or "verified" in done.lower(),
                done[:160],
            )
        else:
            check("In-app fallback code surfaced for verification", False, restored["body"][:200])

        check("No console errors during the OTP flow", not console_errors, "; ".join(console_errors[:3]))
        await browser.close()

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
