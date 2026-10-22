import os
import random
import string
import json
import logging
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

from app.database import engine, Base, get_db
from app.models import Case
from app.schemas import (
    InvestigateRequest,
    InvestigateResponse,
    ApproveResponse,
    MockPortalResponse
)
from app.playwright_runner import inspect_suspicious_url, SCREENSHOTS_DIR, STATIC_DIR
from app.domain_lookup import analyze_domain
from app.ai_analyzer import analyze_scam_with_ai
from app.mock_scams import mock_scam_router

# Initialize database schema
Base.metadata.create_all(bind=engine)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("investigator.api")

app = FastAPI(
    title="Suspicious Link & SMS Investigator API",
    description="Backend API for isolated sandbox scanning, domain intelligence, and AI-driven cybercrime triage.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder for screenshots evidence
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Mount mock scam testbed
app.include_router(mock_scam_router)


@app.get("/")
def read_root():
    return {
        "service": "Suspicious Link & SMS Investigator API",
        "status": "operational",
        "version": "1.0.0",
        "endpoints": [
            "POST /api/investigate",
            "POST /api/approve/{case_id}",
            "GET /api/mock-portal",
            "GET /mock-scam/lottery-claim (TC1 Test Page)",
            "GET /mock-scam/bank-otp (TC2 Test Page)"
        ]
    }


@app.get("/api/mock-portal", response_model=MockPortalResponse)
def mock_cybercrime_portal():
    """
    Simulates the National Cybercrime Reporting Portal ingestion API.
    Returns an official Case Reference ID (e.g. CYB-2026-X89).
    """
    year = 2026
    char_code = random.choice(string.ascii_uppercase)
    num_code = random.randint(10, 99)
    case_ref = f"CYB-{year}-{char_code}{num_code}"
    
    return MockPortalResponse(
        case_reference=case_ref,
        status="REGISTERED_IN_QUEUE",
        jurisdiction="Cyber Forensics & Incident Response Division (CFIR)",
        assigned_unit="Priority Financial Phishing Response Cell"
    )


@app.post("/api/investigate", response_model=InvestigateResponse)
async def investigate_threat(req: InvestigateRequest, db: Session = Depends(get_db)):
    """
    Core investigation pipeline:
    1. Triggers Playwright headless inspection (strict zero-interaction, OTP killswitch)
    2. Runs domain lookup and risk profiling
    3. Prompts AI / Cybercrime logic for Risk Summary & Next Steps
    4. Saves to SQLite DB
    5. Returns draft case to frontend
    """
    logger.info(f"Incoming investigation request for URL: {req.link}")

    # 1. Domain intelligence
    domain_data = analyze_domain(req.link)

    # 2. Playwright sandbox inspection
    playwright_result = await inspect_suspicious_url(req.link)

    # 3. AI Cybercrime Analysis
    risk_level, risk_summary, next_steps = analyze_scam_with_ai(
        message_text=req.message_text,
        link=req.link,
        domain_info=domain_data,
        playwright_result=playwright_result,
        user_action=req.user_action
    )

    # 4. Record Case in Database
    new_case = Case(
        message_text=req.message_text,
        link=req.link,
        user_action=req.user_action,
        domain_info=json.dumps(domain_data),
        screenshot_path=playwright_result.get("screenshot_url"),
        risk_summary=risk_summary,
        risk_level=risk_level,
        next_steps=json.dumps(next_steps),
        status="Pending",
        case_reference=None,
        playwright_status=playwright_result.get("status"),
        playwright_reason=playwright_result.get("reason"),
        extracted_text=playwright_result.get("text")
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    return InvestigateResponse(
        id=new_case.id,
        message_text=new_case.message_text,
        link=new_case.link,
        user_action=new_case.user_action,
        domain_info=json.dumps(domain_data),
        domain_data=domain_data,
        screenshot_path=new_case.screenshot_path,
        screenshot_url=new_case.screenshot_path,
        risk_summary=new_case.risk_summary,
        risk_level=new_case.risk_level,
        next_steps=next_steps,
        status=new_case.status,
        case_reference=new_case.case_reference,
        playwright_status=new_case.playwright_status,
        playwright_reason=new_case.playwright_reason,
        extracted_text=new_case.extracted_text
    )


@app.post("/api/approve/{case_id}", response_model=ApproveResponse)
def approve_and_submit_case(case_id: int, db: Session = Depends(get_db)):
    """
    Triggered when user clicks 'Approve'.
    1. Calls mock Cybercrime API (/api/mock-portal)
    2. Updates DB with Case Reference and status = 'Approved'
    3. Returns case confirmation with required statutory warning
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case with ID #{case_id} not found."
        )

    # Simulate submission to cybercrime portal
    portal_data = mock_cybercrime_portal()
    case_ref = portal_data.case_reference

    case.status = "Approved"
    case.case_reference = case_ref
    db.commit()
    db.refresh(case)

    return ApproveResponse(
        id=case.id,
        status="Approved",
        case_reference=case_ref,
        message=f"Investigation report #{case.id} successfully transmitted to Law Enforcement Cyber Cell.",
        warning="Note: This does not guarantee money recovery.",
        approved_at=case.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if case.created_at else None
    )


@app.get("/api/cases/{case_id}", response_model=InvestigateResponse)
def get_case_details(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    next_steps = []
    if case.next_steps:
        try:
            next_steps = json.loads(case.next_steps)
        except Exception:
            next_steps = [case.next_steps]

    domain_data = None
    if case.domain_info:
        try:
            domain_data = json.loads(case.domain_info)
        except Exception:
            domain_data = {"raw": case.domain_info}

    return InvestigateResponse(
        id=case.id,
        message_text=case.message_text,
        link=case.link,
        user_action=case.user_action,
        domain_info=case.domain_info,
        domain_data=domain_data,
        screenshot_path=case.screenshot_path,
        screenshot_url=case.screenshot_path,
        risk_summary=case.risk_summary or "",
        risk_level=case.risk_level or "High",
        next_steps=next_steps,
        status=case.status,
        case_reference=case.case_reference,
        playwright_status=case.playwright_status,
        playwright_reason=case.playwright_reason,
        extracted_text=case.extracted_text
    )
