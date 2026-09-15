from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"

    id = Column(Integer, primary_key=True, index=True)

    resume_id = Column(
        Integer,
        ForeignKey("resumes.id"),
        nullable=False
    )

    summary = Column(Text, nullable=False)

    skills = Column(Text, nullable=True)

    education = Column(Text, nullable=True)

    experience = Column(Text, nullable=True)

    projects = Column(Text, nullable=True)

    certifications = Column(Text, nullable=True)

    career_recommendation = Column(Text, nullable=True)

    resume = relationship("Resume")