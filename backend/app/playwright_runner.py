import os
import uuid
import datetime
import logging
import asyncio
from typing import Dict, Any
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

logger = logging.getLogger("investigator.playwright")

# Setup screenshots directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
STATIC_DIR = os.path.join(BACKEND_DIR, "static")
SCREENSHOTS_DIR = os.path.join(STATIC_DIR, "screenshots")
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)


def _inspect_sync(url: str, timeout_ms: int = 15000) -> Dict[str, Any]:
    """
    Synchronous Playwright inspection executed in an isolated worker thread.
    Immune to Windows event-loop subprocess transport limitations.
    
    CRITICAL SAFETY CONSTRAINTS:
    - Never fill any input fields.
    - Never click submit buttons.
    - Zero form interaction.
    - Immediate kill-switch abort if credential harvesting inputs are found.
    """
    logger.info(f"Initiating isolated Playwright inspection for: {url}")
    
    # Ensure scheme
    target_url = url.strip()
    if not (target_url.startswith("http://") or target_url.startswith("https://") or target_url.startswith("file://")):
        target_url = "https://" + target_url

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
                "--no-first-run",
                "--no-default-browser-check"
            ]
        )
        
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 SuspiciousLinkInvestigator/1.0",
            ignore_https_errors=True
        )
        
        page = context.new_page()
        page.set_default_timeout(timeout_ms)

        try:
            try:
                page.goto(target_url, wait_until="domcontentloaded", timeout=timeout_ms)
            except Exception as nav_err:
                logger.warning(f"Navigation exception for {target_url}: {nav_err}")
                content = page.content()
                if not content or len(content) < 50:
                    browser.close()
                    return {
                        "status": "error",
                        "reason": f"Unable to reach server or connection timed out: {str(nav_err)}",
                        "screenshot_url": None,
                        "text": ""
                    }

            # Brief pause for hydration
            page.wait_for_timeout(1000)

            # ========================================================
            # CRITICAL SECURITY CHECK (OTP & Password Credential Harvesters)
            # ========================================================
            has_password = page.query_selector('input[type="password"]')
            has_number = page.query_selector('input[type="number"]')
            has_otp_attr = page.query_selector(
                'input[name*="otp" i], input[id*="otp" i], input[placeholder*="otp" i], '
                'input[name*="pass" i], input[autocomplete*="one-time-code" i], '
                'input[maxlength="6"][type="text"], input[maxlength="4"][type="text"]'
            )

            if has_password is not None or has_number is not None or has_otp_attr is not None:
                # IMMEDIATE ABORT - Zero interaction
                logger.warning(f"Credential harvester detected on {target_url}. Aborting inspection immediately!")
                browser.close()
                return {
                    "status": "aborted",
                    "reason": "Fake OTP page detected. No data entered."
                }

            # ========================================================
            # SAFE PATH: Full-page screenshot and text extraction
            # ========================================================
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"ss_{timestamp}_{uuid.uuid4().hex[:8]}.png"
            filepath = os.path.join(SCREENSHOTS_DIR, filename)

            page.screenshot(path=filepath, full_page=True)

            try:
                extracted_text = page.evaluate(
                    """() => {
                        const clone = document.body ? document.body.cloneNode(true) : document.documentElement.cloneNode(true);
                        const badElements = clone.querySelectorAll('script, style, noscript, svg');
                        badElements.forEach(el => el.remove());
                        return (clone.innerText || clone.textContent || '').replace(/\\s+/g, ' ').trim();
                    }"""
                )
            except Exception:
                extracted_text = "Content loaded, but text extraction was blocked or page rendered dynamic canvas."

            trimmed_text = extracted_text[:2500] if extracted_text else "No textual content extracted."
            screenshot_url = f"/static/screenshots/{filename}"

            browser.close()

            return {
                "status": "inspected",
                "text": trimmed_text,
                "screenshot_url": screenshot_url,
                "screenshot_path": filepath
            }

        except PlaywrightTimeoutError:
            browser.close()
            return {
                "status": "error",
                "reason": "Page load timed out (host unreachable, blocked, or slow).",
                "screenshot_url": None,
                "text": ""
            }
        except Exception as e:
            try:
                browser.close()
            except Exception:
                pass
            return {
                "status": "error",
                "reason": f"Inspection error: {str(e)}",
                "screenshot_url": None,
                "text": ""
            }


async def inspect_suspicious_url(url: str, timeout_ms: int = 15000) -> Dict[str, Any]:
    """
    Asynchronous interface that safely runs the Playwright inspection in a worker thread.
    """
    return await asyncio.to_thread(_inspect_sync, url, timeout_ms)
