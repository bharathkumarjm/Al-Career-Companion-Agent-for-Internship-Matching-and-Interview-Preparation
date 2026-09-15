from sqlalchemy import Column, Integer, String, Text
from app.database import Base


class Internship(Base):
    __tablename__ = "internships"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=True, default="TechCorp")
    description = Column(Text, nullable=True)
    required_skills = Column(Text, nullable=False)
    preferred_skills = Column(Text, nullable=True)
    domain = Column(String, nullable=True, default="Software Engineering")
    location = Column(String, nullable=True, default="Remote")
    work_mode = Column(String, nullable=True, default="Hybrid")
    stipend = Column(String, nullable=True, default="Competitive")
    duration = Column(String, nullable=True, default="3-6 months")
    education_requirements = Column(String, nullable=True)
    experience_requirements = Column(String, nullable=True)
    responsibilities = Column(Text, nullable=True)
    interview_process = Column(Text, nullable=True)
    status = Column(String, default="active", nullable=False)