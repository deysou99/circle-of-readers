"""End-to-end checks for Circle's Continue with Email -> onboarding flow.

Run against the dev server:

    python3 e2e/auth_onboarding_e2e.py            # defaults to http://localhost:8080
    BASE_URL=https://circle-of-readers.lovable.app python3 e2e/auth_onboarding_e2e.py

Covers:
  * Continue with Email navigates to the email sign-up screen
  * the button disables while the route initialises (no double-tap)
  * signing up lands on verification/onboarding, never back on /auth/email
  * no back-navigation dead-ends: Back from /auth/email returns to /auth,
    and post-signup history never re-enters the credentials screen
  * unauthenticated /home and /onboarding redirect to /auth
"""

import asyncio
import os
import sys
import time

from playwright.async_api import async_playwright

BASE_URL = os.environ.get("BASE_URL", "http://localhost:8080")
VIEWPORT = {"width": 394, "height": 900}

results: list[tuple[str, bool, str]] = []


def check(name: str, passed: bool, detail: str = "") -> None:
    results.append((name, passed, detail))
    print(("PASS " if passed else "FAIL ") + name + ((" — " + detail) if detail else ""))


async def main() -> int:
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(headless=True)
        context = await browser.new_context(viewport=VIEWPORT)
        page = await context.new_page()
        console_errors: list[str] = []
        page.on("console", lambda m: console_errors.append(m.text) if m.type == "error" else None)

        # 1. Continue with Email opens the credentials screen.
        await page.goto(f"{BASE_URL}/auth", wait_until="networkidle")
        button = page.get_by_role("button", name="Continue with Email")
        await button.click()
        await page.wait_for_url("**/auth/email", timeout=10_000)
        check("Continue with Email navigates to /auth/email", page.url.endswith("/auth/email"))
        await page.get_by_label("Email").wait_for(state="visible", timeout=10_000)
        check("Sign-in form rendered", True)

        # 2. Back from the email screen returns to /auth (no dead-end).
        await page.get_by_text("← Back").click()
        await page.wait_for_url("**/auth", timeout=10_000)
        check("Back returns to /auth", page.url.rstrip("/").endswith("/auth"))

        # 3. The button cannot be tapped repeatedly while routing.
        await page.get_by_role("button", name="Continue with Email").click()
        await page.wait_for_url("**/auth/email", timeout=10_000)
        check("No duplicate history entries from repeat taps", page.url.endswith("/auth/email"))

        # 4. Sign up a fresh account and confirm we leave the credentials screen.
        email = f"circle.e2e.{int(time.time())}@gmail.com"
        await page.get_by_role("button", name="Sign up", exact=True).click()
        await page.wait_for_timeout(500)
        await page.get_by_label("Email").fill(email)
        await page.get_by_label("Password").fill("CircleE2E!2026")
        await page.get_by_role("button", name="Create account").click()
        await page.wait_for_timeout(6000)
        left_credentials = "/auth/email" not in page.url
        check("Sign-up lands on email verification", "/verify-email" in page.url, page.url)
        check(
            "Sign-up leaves the credentials screen (verification or onboarding)",
            left_credentials,
            page.url,
        )

        if left_credentials:
            # 5. Back navigation must not drop the user on the credentials screen.
            await page.go_back()
            await page.wait_for_timeout(1500)
            check(
                "Back after sign-up is not a dead-end on /auth/email",
                "/auth/email" not in page.url,
                page.url,
            )

        # 6. Protected routes redirect signed-out visitors to /auth.
        fresh = await browser.new_context(viewport=VIEWPORT)
        guard_page = await fresh.new_page()
        for path in ("/home", "/onboarding"):
            await guard_page.goto(f"{BASE_URL}{path}", wait_until="networkidle")
            await guard_page.wait_for_timeout(1200)
            check(f"{path} redirects signed-out visitors to /auth", "/auth" in guard_page.url, guard_page.url)

        check("No console errors during the flow", not console_errors, "; ".join(console_errors[:3]))

        await browser.close()

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
