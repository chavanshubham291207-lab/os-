from typing import Optional, List, Any
from pydantic import BaseModel, Field

class InvestigateRequest(BaseModel):
    message_text: str = Field(..., description="The SMS or message body received by the victim")
    link: str = Field(..., description="The suspicious URL inside the message")
    user_action: str = Field(..., description="What the user did: 'Clicked link', 'Entered OTP', 'Just received'")

class InvestigateResponse(BaseModel):
    id: int
    message_text: str
    link: str
    user_action: str
    domain_info: Optional[str] = None
    domain_data: Optional[dict] = None
    screenshot_path: Optional[str] = None
    screenshot_url: Optional[str] = None
    risk_summary: str
    risk_level: str
    next_steps: List[str]
    status: str
    case_reference: Optional[str] = None
    playwright_status: Optional[str] = None
    playwright_reason: Optional[str] = None
    extracted_text: Optional[str] = None

class ApproveResponse(BaseModel):
    id: int
    status: str
    case_reference: str
    message: str
    warning: str
    approved_at: Optional[str] = None

class MockPortalResponse(BaseModel):
    case_reference: str
    status: str
    jurisdiction: str
    assigned_unit: str
