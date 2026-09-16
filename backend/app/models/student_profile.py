from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    university = Column(String(200), nullable=True)
    degree = Column(String(150), nullable=True)
    graduation_year = Column(String(20), nullable=True)
    target_role = Column(String(150), nullable=True)
    bio = Column(Text, nullable=True)
    location = Column(String(150), nullable=True)
    github_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    portfolio_url = Column(String(255), nullable=True)
    skills = Column(Text, nullable=True)  # JSON array string of verified skills
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
