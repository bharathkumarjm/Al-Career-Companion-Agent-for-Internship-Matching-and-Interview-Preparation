from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company = Column(String(150), nullable=False)
    role = Column(String(150), nullable=False)
    location = Column(String(100), nullable=True, default="Remote")
    stipend = Column(String(100), nullable=True, default="Competitive")
    status = Column(String(50), nullable=False, default="Applied")  # Applied, Screening, Interviewing, Offered, Rejected, Accepted
    applied_date = Column(String(50), nullable=True)
    deadline = Column(String(50), nullable=True)
    interview_date = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    job_link = Column(String(255), nullable=True)
    match_score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
