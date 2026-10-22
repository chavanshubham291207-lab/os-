import asyncio
import os
import sys

# Ensure Windows Proactor Event Loop for Playwright on Windows
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.playwright_runner import inspect_suspicious_url
from app.domain_lookup import analyze_domain
from app.ai_analyzer import analyze_scam_with_ai

async def run_security_tests():
    print("=" * 60, flush=True)
    print(" RUNNING AUTOMATED CYBERSECURITY PIPELINE TESTS", flush=True)
    print("=" * 60, flush=True)

    # TC2: Fake OTP page -> Playwright aborts, no fields filled
    print("\n[TEST 2] Testing Playwright on Fake OTP & Credential Page...", flush=True)
    # Create temp html files for reliable local file:// navigation
    temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_pages")
    os.makedirs(temp_dir, exist_ok=True)
    
    otp_file = os.path.join(temp_dir, "test_otp.html")
    with open(otp_file, "w", encoding="utf-8") as f:
        f.write("""<!DOCTYPE html>
<html>
<head><title>Bank Security Verification</title></head>
<body>
<h2>Emergency KYC Verification</h2>
<form>
  <input type="text" name="username" placeholder="Username">
  <input type="password" name="password" placeholder="Netbanking Password">
  <input type="number" name="otp" placeholder="Enter 6-digit OTP">
  <button type="submit">Submit</button>
</form>
</body>
</html>""")

    otp_url = "file:///" + otp_file.replace("\\", "/")
    print(f"Navigating to {otp_url}...", flush=True)
    result_tc2 = await inspect_suspicious_url(otp_url)
    print(f"Playwright Result TC2: {result_tc2}", flush=True)
    assert result_tc2["status"] == "aborted", f"Expected aborted, got {result_tc2['status']}"
    assert "Fake OTP page detected. No data entered." in result_tc2["reason"]
    print(">>> PASS: TC2 verified! Zero interaction, browser immediately aborted upon detecting credential inputs.", flush=True)

    # TC1: Suspicious domain without OTP -> Playwright inspects, screenshot taken
    print("\n[TEST 1] Testing Playwright on Suspicious Prize Page (No OTP fields)...", flush=True)
    prize_file = os.path.join(temp_dir, "test_prize.html")
    with open(prize_file, "w", encoding="utf-8") as f:
        f.write("""<!DOCTYPE html>
<html>
<head><title>Mega Lottery Prize</title></head>
<body>
<h1>Congratulations Lucky Winner!</h1>
<p>You won 250,000 USD in the International Telecom Draw. Claim your reward today!</p>
<button>Claim Reward</button>
</body>
</html>""")

    prize_url = "file:///" + prize_file.replace("\\", "/")
    print(f"Navigating to {prize_url}...", flush=True)
    result_tc1 = await inspect_suspicious_url(prize_url)
    print(f"Playwright Result TC1: status={result_tc1['status']}, screenshot={result_tc1.get('screenshot_url')}", flush=True)
    assert result_tc1["status"] == "inspected", f"Expected inspected, got {result_tc1['status']}"
    assert result_tc1.get("screenshot_url") is not None
    assert "Lucky Winner" in result_tc1.get("text", "")
    print(">>> PASS: TC1 verified! Page inspected, screenshot saved to static directory.", flush=True)

    # TC3: Report Draft with User-Confirmed Facts and mandatory statement if aborted
    print("\n[TEST 3] Testing AI Cybercrime Logic for User-Confirmed Facts...", flush=True)
    domain_info = analyze_domain("http://suspicious-bank-alert.xyz/verify")
    risk_level, risk_summary, next_steps = analyze_scam_with_ai(
        message_text="URGENT: Your bank debit card is locked. Verify at http://suspicious-bank-alert.xyz/verify",
        link="http://suspicious-bank-alert.xyz/verify",
        domain_info=domain_info,
        playwright_result=result_tc2,
        user_action="Entered OTP"
    )
    print(f"Risk Level: {risk_level}", flush=True)
    print(f"Risk Summary: {risk_summary}", flush=True)
    print(f"Next Steps: {next_steps}", flush=True)
    assert "No credentials were entered" in risk_summary
    print(">>> PASS: TC3 verified! Report draft cites verified facts and states 'No credentials were entered'.", flush=True)

    print("\n" + "=" * 60, flush=True)
    print(" ALL BACKEND SECURITY CHECKS PASSED SUCCESSFULLY!", flush=True)
    print("=" * 60, flush=True)

if __name__ == "__main__":
    asyncio.run(run_security_tests())
