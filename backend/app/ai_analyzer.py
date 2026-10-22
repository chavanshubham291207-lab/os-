import os
import json
import logging
from typing import Dict, Any, List, Tuple
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("investigator.ai")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()


def analyze_with_heuristics(
    message_text: str,
    link: str,
    domain_info: Dict[str, Any],
    playwright_result: Dict[str, Any],
    user_action: str
) -> Tuple[str, str, List[str]]:
    """
    Fallback deterministic cybercrime analyst heuristic engine.
    Follows identical prompt constraints:
    - Use ONLY provided facts.
    - If Playwright aborted due to OTP, explicitly state 'No credentials were entered'.
    """
    is_aborted = playwright_result.get("status") == "aborted"
    user_compromised = user_action.lower() in ["entered otp", "entered password", "entered details"]
    user_clicked = user_action.lower() == "clicked link"
    
    # Determine risk level
    if user_compromised or is_aborted:
        risk_level = "High"
    elif user_clicked:
        risk_level = "High"
    elif domain_info.get("threat_score", 0) > 80:
        risk_level = "High"
    else:
        risk_level = "Medium"

    # Assemble concise Risk Summary based ONLY on provided facts
    summary_parts = []
    
    summary_parts.append(
        f"Forensic examination confirms this message ('{message_text[:80]}...') "
        f"is an engineered phishing lure targeting recipients with fraudulent link '{link}'."
    )
    
    domain_age = domain_info.get("domain_age", "unknown age")
    registrar = domain_info.get("registrar", "unknown registrar")
    summary_parts.append(
        f"Domain Telemetry: Hosted on host '{domain_info.get('hostname')}', registered via {registrar} ({domain_age})."
    )

    if is_aborted:
        summary_parts.append(
            "CRITICAL SECURITY EVENT: The automated inspection sandbox detected deceptive OTP/credential input fields. "
            "Under strict zero-interaction protocol, the session was immediately aborted. "
            "No credentials were entered."
        )
    elif playwright_result.get("status") == "inspected":
        text_snippet = playwright_result.get("text", "")[:120]
        summary_parts.append(
            f"The landing page was visually cataloged and inspected without submitting data. "
            f"Extracted page content indicates deceptive lure: \"{text_snippet}\"."
        )

    summary_parts.append(f"Reported user engagement status: '{user_action}'.")
    risk_summary = " ".join(summary_parts)

    # Next steps tailored to user action and facts
    next_steps = []
    if user_compromised:
        next_steps.append("URGENT: Immediately contact your financial institution / bank to freeze associated accounts and cards.")
        next_steps.append("Reset your banking, email, and primary account passwords from a separate known-safe device.")
        next_steps.append("Enable app-based 2FA (Authenticator app) rather than SMS-based OTP.")
        next_steps.append("Preserve the SMS and transaction alerts as official cybercrime evidence.")
    elif user_clicked:
        next_steps.append("Run a comprehensive malware and spyware scan on the device used to open the link.")
        next_steps.append("Clear browser cache, cookies, and local session storage for that domain.")
        next_steps.append("Do not enter any personal credentials or banking details on unknown pages.")
        next_steps.append("Monitor bank and mobile statements for unexpected activity.")
    else:
        next_steps.append("Block the originating sender phone number/handle on your mobile device.")
        next_steps.append("Do not click, open, or forward the link to any other parties.")
        next_steps.append("Report the fraudulent sender number to your telecom carrier and national fraud portal.")

    next_steps.append("Submit this formal investigative report to cybercrime authorities for domain takedown.")

    return risk_level, risk_summary, next_steps


def analyze_scam_with_ai(
    message_text: str,
    link: str,
    domain_info: Dict[str, Any],
    playwright_result: Dict[str, Any],
    user_action: str
) -> Tuple[str, str, List[str]]:
    """
    Calls Google Gemini API (or gracefully falls back to deterministic expert engine).
    Prompt strictly mandates:
    "You are a cybercrime investigator. Analyze this scam. Generate a concise Risk Summary and Next Steps. 
     Use ONLY provided facts. If Playwright aborted due to OTP, explicitly state 'No credentials were entered'."
    """
    if not GEMINI_API_KEY:
        logger.info("GEMINI_API_KEY not configured. Utilizing cybersecurity heuristic analyzer.")
        return analyze_with_heuristics(message_text, link, domain_info, playwright_result, user_action)

    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)

        prompt = f"""You are a cybercrime investigator. Analyze this scam. Generate a concise Risk Summary and Next Steps.
Use ONLY provided facts. If Playwright aborted due to OTP, explicitly state 'No credentials were entered'.

FACTS PROVIDED:
- Message Text received: "{message_text}"
- Suspicious Link: "{link}"
- User Action: "{user_action}"
- Domain Intelligence: {json.dumps(domain_info)}
- Playwright Isolated Inspection Result: {json.dumps(playwright_result)}

Respond ONLY in valid JSON matching this exact schema:
{{
  "risk_level": "High" | "Medium" | "Low",
  "risk_summary": "Concise summary citing provided facts. Must explicitly include 'No credentials were entered' if Playwright status is aborted.",
  "next_steps": ["Actionable step 1", "Actionable step 2", "Actionable step 3"]
}}
"""
        response = client.models.generate_content(
            model='gemini-3.8-flash',
            contents=prompt,
        )
        raw_text = response.text.strip()
        # Clean markdown wrappers if any
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()

        data = json.loads(raw_text)
        risk_level = data.get("risk_level", "High")
        risk_summary = data.get("risk_summary", "")
        next_steps = data.get("next_steps", [])

        # Hard guardrail verification for safety rule
        if playwright_result.get("status") == "aborted" and "No credentials were entered" not in risk_summary:
            risk_summary += " Inspection aborted: No credentials were entered."

        return risk_level, risk_summary, next_steps

    except Exception as e:
        logger.warning(f"Gemini API call failed ({e}). Falling back to cybercrime heuristic engine.")
        return analyze_with_heuristics(message_text, link, domain_info, playwright_result, user_action)
