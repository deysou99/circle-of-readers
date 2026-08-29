"""Hard-reload every auth/onboarding route and assert the right layout renders.

Verifies there is no blank screen, no runtime error overlay, no duplicate-React
crash, and no incorrect redirect flicker on a cold load of each route.
"""

import asyncio
from pathlib import Path

from playwright.async_api import async_playwright

BASE = "http://localhost:8080"
SCREENSHOTS = Path(__file__).parent / "screenshots"
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

# route -> substring expected in the URL after the guards settle
ROUTES = {
    "/": "/",
    "/auth": "/auth",
    "/auth/email": "/auth/email",
    "/verify-email": "/auth",
    "/onboarding": "/auth",
    "/home": "/auth",
    "/profile": "/auth",
    "/profile/onboarding-progress": "/auth",
    "/profile/onboarding-analytics": "/auth",
    "/admin/otp": "/auth",
    "/reset-password": "/reset-password",
}

FATAL = ("reading 'use'", "reading 'useContext'", "Invalid hook call", "Minified React error")


async def main() -> None:
    failures: list[str] = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        for route, expected in ROUTES.items():
            context = await browser.new_context(viewport={"width": 1280, "height": 1800})
            page = await context.new_page()
            errors: list[str] = []
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.on(
                "console",
                lambda m: errors.append(m.text) if m.type == "error" else None,
            )

            await page.goto(f"{BASE}{route}", wait_until="domcontentloaded")
            await page.wait_for_timeout(1500)
            # Hard reload to exercise the cold-start guard path again.
            await page.reload(wait_until="domcontentloaded")
            await page.wait_for_timeout(1500)

            body = (await page.inner_text("body")).strip()
            url = page.url
            fatal = [e for e in errors if any(f in e for f in FATAL)]

            if expected not in url:
                failures.append(f"{route}: expected URL to contain {expected}, got {url}")
            if len(body) < 10:
                failures.append(f"{route}: blank screen")
            if fatal:
                failures.append(f"{route}: fatal runtime error {fatal[0][:160]}")
            if "This screen didn't load" in body or "needs a hard refresh" in body:
                failures.append(f"{route}: error boundary rendered")

            print(f"{route} -> {url} | chars={len(body)} | errors={len(fatal)}")
            await page.screenshot(path=str(SCREENSHOTS / f"reload{route.replace('/', '_')}.png"))
            await context.close()
        await browser.close()

    print("\n=== RESULT ===")
    if failures:
        for f in failures:
            print("FAIL:", f)
        raise SystemExit(1)
    print(f"PASS: {len(ROUTES)}/{len(ROUTES)} routes reloaded cleanly")


asyncio.run(main())
