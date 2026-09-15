import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.student_profile import StudentProfile
from app.utils.auth import get_current_user
from app.services.groq_service import analyze_skill_gap

router = APIRouter(
    prefix="/api/skill-gap",
    tags=["Skill Gap Analysis & Recommendations"]
)


class SkillGapRequest(BaseModel):
    target_role: str
    job_description: Optional[str] = ""
    candidate_skills: Optional[List[str]] = None


POPULAR_ROLES = [
    {
        "id": "backend",
        "title": "Backend Developer",
        "domain": "Software Engineering",
        "core_skills": ["Python", "FastAPI", "SQL", "Docker", "REST APIs", "Git"]
    },
    {
        "id": "fullstack",
        "title": "Full Stack Developer",
        "domain": "Full Stack",
        "core_skills": ["JavaScript", "React", "Node.js", "SQL", "HTML/CSS", "Git"]
    },
    {
        "id": "genai",
        "title": "Generative AI & LLM Engineer",
        "domain": "Artificial Intelligence",
        "core_skills": ["Python", "Machine Learning", "NLP", "LangChain", "Vector Databases", "Prompt Engineering"]
    },
    {
        "id": "data_science",
        "title": "Data Scientist / ML Engineer",
        "domain": "Data Science",
        "core_skills": ["Python", "Machine Learning", "Statistics", "Pandas", "Scikit-learn", "SQL"]
    },
    {
        "id": "devops",
        "title": "Cloud & DevOps Engineer",
        "domain": "Cloud & DevOps",
        "core_skills": ["Linux", "Docker", "Kubernetes", "AWS", "CI/CD", "Shell Scripting"]
    },
    {
        "id": "frontend",
        "title": "Frontend Developer",
        "domain": "Frontend",
        "core_skills": ["React", "JavaScript", "TypeScript", "Tailwind CSS", "HTML/CSS", "Git"]
    },
    {
        "id": "cybersecurity",
        "title": "Cybersecurity Analyst",
        "domain": "Cybersecurity",
        "core_skills": ["Networking", "Linux", "Information Security", "Python", "Vulnerability Assessment"]
    },
    {
        "id": "data_analyst",
        "title": "Data Analyst",
        "domain": "Data Analytics",
        "core_skills": ["SQL", "Excel", "Power BI", "Python", "Data Visualization"]
    }
]


@router.get("/roles")
def get_popular_roles():
    return POPULAR_ROLES


@router.post("/analyze")
def run_skill_gap_analysis(
    payload: SkillGapRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_role = payload.target_role.strip()
    if not target_role:
        raise HTTPException(status_code=400, detail="Target role is required")

    candidate_skills = payload.candidate_skills or []

    # If candidate skills were not explicitly provided in the request, load from user's active resume or profile
    if not candidate_skills:
        resume = db.query(Resume).filter(
            Resume.owner_id == current_user.id,
            Resume.is_active == True
        ).order_by(Resume.id.desc()).first()

        if not resume:
            resume = db.query(Resume).filter(
                Resume.owner_id == current_user.id
            ).order_by(Resume.id.desc()).first()

        if resume and resume.parsed_data:
            try:
                p = json.loads(resume.parsed_data)
                sk = p.get("skills", {})
                if isinstance(sk, dict):
                    candidate_skills = sk.get("technical_skills", []) + sk.get("tools_frameworks", [])
                elif isinstance(sk, list):
                    candidate_skills = sk
            except Exception:
                pass

        if not candidate_skills:
            profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
            if profile and profile.skills:
                try:
                    candidate_skills = json.loads(profile.skills)
                except Exception:
                    candidate_skills = [s.strip() for s in profile.skills.split(",") if s.strip()]

    # Run AI skill gap analysis
    analysis_result = analyze_skill_gap(
        candidate_skills=candidate_skills,
        target_role=target_role,
        job_description=payload.job_description or ""
    )

    return analysis_result
