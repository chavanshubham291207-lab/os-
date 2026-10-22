from fastapi import APIRouter
from fastapi.responses import HTMLResponse

mock_scam_router = APIRouter(prefix="/mock-scam", tags=["Mock Scam Pages For Testing"])

@mock_scam_router.get("/lottery-claim", response_class=HTMLResponse)
async def mock_lottery_page():
    """
    Test Case 1 Target: Suspicious lottery scam page.
    Has NO password or OTP inputs. Playwright inspects safely and takes screenshot.
    """
    return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>CONGRATULATIONS! Mega Cash Prize Notification</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center; }
        .card { background: #1e293b; border: 2px solid #eab308; border-radius: 12px; max-width: 600px; margin: 0 auto; padding: 30px; box-shadow: 0 10px 25px rgba(234, 179, 8, 0.2); }
        h1 { color: #facc15; font-size: 28px; text-transform: uppercase; }
        .amount { font-size: 38px; font-weight: bold; color: #22c55e; margin: 20px 0; }
        p { color: #cbd5e1; line-height: 1.6; }
        .claim-btn { background: linear-gradient(135deg, #eab308, #ca8a04); color: #000; font-weight: bold; border: none; padding: 14px 28px; font-size: 16px; border-radius: 8px; cursor: pointer; margin-top: 20px; }
        .fine-print { font-size: 11px; color: #64748b; margin-top: 25px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>Official Reward Notice</h1>
        <p>Your mobile number was selected in the Global Telecommunications Jubilee Draw.</p>
        <div class="amount">$250,000.00 USD</div>
        <p>Reference Ticket ID: <strong>WIN-99281-GL</strong></p>
        <p>To register your dispatch address, please verify your identity before the 24-hour expiration window closes.</p>
        <button class="claim-btn">CLAIM MY CASH REWARD NOW</button>
        <div class="fine-print">International Sweepstakes Regulation Code: SEC-8891-B. Unclaimed awards will be surrendered to the state treasury.</div>
    </div>
</body>
</html>
"""

@mock_scam_router.get("/bank-otp", response_class=HTMLResponse)
async def mock_bank_otp_page():
    """
    Test Case 2 Target: Fake banking verification page with OTP and Password fields.
    Playwright must detect this, abort immediately, enter NO data, and return aborted status.
    """
    return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Urgent: Account Suspension Verification - Security Portal</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f1f5f9; color: #1e293b; padding: 40px; }
        .login-box { background: #ffffff; border: 1px solid #cbd5e1; border-top: 4px solid #dc2626; border-radius: 8px; max-width: 440px; margin: 0 auto; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 24px; }
        .alert-banner { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px; border-radius: 6px; font-size: 13px; margin-bottom: 20px; font-weight: 500; }
        label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: #334155; }
        input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #94a3b8; border-radius: 6px; margin-bottom: 16px; font-size: 14px; }
        .submit-btn { width: 100%; background: #dc2626; color: white; padding: 12px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 15px; }
    </style>
</head>
<body>
    <div class="login-box">
        <div class="header">
            <h2 style="margin: 0; color: #0f172a;">Federal Savings Online</h2>
            <p style="margin: 4px 0 0; font-size: 13px; color: #64748b;">Emergency KYC Compliance Notice</p>
        </div>
        <div class="alert-banner">
            Action Required: Your online banking access is temporarily frozen due to unverified transactions.
        </div>
        <form>
            <label for="acc">Account / Registered Mobile</label>
            <input type="text" id="acc" name="account_number" placeholder="Enter Registered Phone or Account">

            <label for="pwd">Netbanking Password</label>
            <input type="password" id="pwd" name="password" placeholder="Enter Netbanking Password">

            <label for="otp">One-Time Security Passcode (OTP)</label>
            <input type="number" id="otp" name="otp" placeholder="Enter 6-digit OTP sent to mobile">

            <button type="submit" class="submit-btn">Verify & Unlock Account</button>
        </form>
    </div>
</body>
</html>
"""
