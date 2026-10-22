import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class Case(Base):
    __tablename__ = "Cases"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    message_text = Column(Text, nullable=False)
    link = Column(String(1024), nullable=False)
    user_action = Column(String(100), nullable=False)  # 'Clicked link', 'Entered OTP', 'Just received'
    domain_info = Column(Text, nullable=True)          # JSON string or structured summary
    screenshot_path = Column(String(512), nullable=True) # relative path or static URL
    risk_summary = Column(Text, nullable=True)
    risk_level = Column(String(20), default="High")    # High / Med / Low
    next_steps = Column(Text, nullable=True)           # Actionable steps list / JSON
    status = Column(String(50), default="Pending")     # 'Pending' or 'Approved'
    case_reference = Column(String(100), nullable=True) # e.g., 'CYB-2026-X89'
    playwright_status = Column(String(50), nullable=True) # 'inspected' or 'aborted'
    playwright_reason = Column(Text, nullable=True)
    extracted_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
