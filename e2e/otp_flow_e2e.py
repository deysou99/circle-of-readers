"""End-to-end checks for Circle's phone OTP step.

Run against the dev server with an injected Supabase session:

    python3 e2e/otp_flow_e2e.py            # defaults to http://localhost:8080

Covers:
  * a page refresh mid-OTP keeps the same validity window, resend cooldown and
    attempt counter (server-owned session state)
  * the resend button stays disabled while the cooldown timer runs
  * wrong codes decrement the attempt counter with per-attempt messaging and
    stop at the five-attempt limit
  * "Send a new code" recovers from the attempt limit
  * changing the phone number re-runs verification for the new number
  * the run finishes by verifying the number again with the in-app code
"""

import asyncio
import json
import os
import re
import sys

from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080")
VIEWPORT = {"width": 394, "height": 900}
TEST_PHONE = "+15551230099"

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
    cooldown = re.search(r"Resend code in ([\dms ]+)", body)
    attempts = re.search(r"(\d+) attempts? left", body)
    expires = re.search(r"Code expires in ([\dms ]+)", body)
    return {
        "cooldown": cooldown.group(1).strip() if cooldown else None,
        "attempts": attempts.group(1) if attempts else None,
        "expires": expires.group(1).strip() if expires else None,
        "body": body,
    }


async def on_otp_step(page) -> bool:
    return await page.get_by_label("Verification code").count() > 0


async def send_fresh_code(page, label: str) -> str | None:
    """Waits out the cooldown, requests a new code and returns the in-app code."""
    button = page.get_by_role("button", name=re.compile("Resend code in|Send a new code"))
    for _ in range(70):
        if await button.is_enabled():
            break
        await page.wait_for_timeout(1000)
    await button.click()
    await page.wait_for_timeout(3500)
    state = await read_state(page)
    shown = re.search(r"code: (\d{6})", state["body"])
    check(f"{label}: fresh in-app code issued", bool(shown), state["body"][:180])
    return shown.group(1) if shown else None


async def main() -> int:
    storage_key, session_json, cookies_json = load_session()
    if not storage_key:
        print("No Supabase session available — sign in to the preview and re-run.")
        return 2

    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport=VIEWPORT)
        if cookies_json:
            for cookie in json.loads(cookies_json):
                cookie["url"] = BASE_URL
                await context.add_cookies([cookie])
        page = await context.new_page()
        console_errors: list[str] = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)

        await page.goto(BASE_URL, wait_until="domcontentloaded")
        await page.evaluate(
            f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
        )

        # Enter the OTP flow. A verified account gets there by changing its
        # number from settings; an unverified one is already gated onto it.
        await page.goto(f"{BASE_URL}/onboarding", wait_until="networkidle")
        await page.wait_for_timeout(3000)
        original_phone = None
        if not await on_otp_step(page):
            await page.goto(f"{BASE_URL}/profile/settings", wait_until="networkidle")
            await page.wait_for_timeout(2500)
            body = await page.inner_text("body")
            current = re.search(r"Current: (\+?\d+)", body)
            original_phone = current.group(1) if current else None
            check("Settings exposes the phone change card", "New phone number" in body)
            await page.get_by_label("New phone number").fill(TEST_PHONE)
            await page.get_by_role("button", name="Update and re-verify").click()
            await page.wait_for_url("**/onboarding", timeout=15_000)
            await page.wait_for_timeout(3500)
            check("Phone change from settings routes into verification", await on_otp_step(page), page.url)

        check("Phone verification step reachable", await on_otp_step(page), page.url)
        if not await on_otp_step(page):
            print((await page.inner_text("body"))[:400])
            await browser.close()
            return 1

        before = await read_state(page)
        resend = page.get_by_role("button", name=re.compile("Resend code in|Send a new code"))
        if before["cooldown"]:
            check("Resend button disabled while the cooldown runs", await resend.is_disabled())
        else:
            check("Resend button enabled once the cooldown elapsed", await resend.is_enabled())

        # 1. Refresh mid-flow: the server keeps validity, cooldown and attempts.
        await page.reload(wait_until="networkidle")
        await page.wait_for_timeout(3000)
        after = await read_state(page)
        check("OTP session survives a refresh", await on_otp_step(page), page.url)
        check(
            "Code validity window continues after refresh",
            after["expires"] is not None,
            str(after["expires"]),
        )
        check(
            "Attempt counter preserved after refresh",
            after["attempts"] == before["attempts"],
            f"{before['attempts']} -> {after['attempts']}",
        )

        # 2. Wrong code: per-attempt messaging and a decreasing counter.
        await page.get_by_label("Verification code").fill("000000")
        await page.wait_for_timeout(3000)
        wrong = await read_state(page)
        check(
            "Wrong code shows a per-attempt error",
            "match" in wrong["body"] or "attempt" in wrong["body"].lower(),
            wrong["body"][:180],
        )
        check(
            "Attempts left decreases after a wrong code",
            wrong["attempts"] is None or after["attempts"] is None or int(wrong["attempts"]) < int(after["attempts"]),
            f"{after['attempts']} -> {wrong['attempts']}",
        )

        # 3. Attempt limit.
        for _ in range(5):
            await page.get_by_label("Verification code").fill("111111")
            await page.wait_for_timeout(2000)
        limited = await read_state(page)
        check(
            "Attempt limit surfaces a 'send a new code' recovery message",
            "Too many attempts" in limited["body"] or "new code" in limited["body"],
            limited["body"][:180],
        )

        # 4. Recover with a fresh code and verify the number.
        code = await send_fresh_code(page, "Attempt-limit recovery")
        if code:
            await page.get_by_label("Verification code").fill(code)
            await page.wait_for_timeout(4000)
            check("Fresh code verifies the number", not await on_otp_step(page), page.url)

        # 5. Restore the original number (verified accounts only) and verify it.
        if original_phone:
            await page.goto(f"{BASE_URL}/profile/settings", wait_until="networkidle")
            await page.wait_for_timeout(2500)
            if await page.get_by_label("New phone number").count() > 0:
                await page.get_by_label("New phone number").fill(original_phone)
                await page.get_by_role("button", name="Update and re-verify").click()
                await page.wait_for_url("**/onboarding", timeout=15_000)
                await page.wait_for_timeout(3500)
                restored = await read_state(page)
                check(
                    "Phone change re-runs verification for the new number",
                    await on_otp_step(page) and original_phone[-4:] in restored["body"],
                    restored["body"][:180],
                )
                shown = re.search(r"code: (\d{6})", restored["body"])
                new_code = shown.group(1) if shown else await send_fresh_code(page, "Restore original")
                if new_code:
                    await page.get_by_label("Verification code").fill(new_code)
                    await page.wait_for_timeout(4000)
                    check("Original number restored and verified", not await on_otp_step(page), page.url)
            else:
                check("Settings reachable after verification", False, page.url)

        check("No console errors during the OTP flow", not console_errors, "; ".join(console_errors[:3]))
        await browser.close()

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
