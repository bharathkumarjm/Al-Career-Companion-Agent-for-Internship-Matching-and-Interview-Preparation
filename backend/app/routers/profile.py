import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.student_profile import StudentProfile
from app.models.resume import Resume
from app.utils.auth import get_current_user

router = APIRouter(
    prefix="/api/profile",
    tags=["Student Profile"]
)


class ProfileUpdateSchema(BaseModel):
    phone: Optional[str] = None
    university: Optional[str] = None
    degree: Optional[str] = None
    graduation_year: Optional[str] = None
    target_role: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: Optional[List[str]] = None


@router.get("/me")
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(
            user_id=current_user.id,
            university="Computer Science & Engineering",
            degree="Bachelor of Engineering / B.Tech",
            graduation_year="2026",
            target_role="Software Engineer Intern",
            bio="Passionate student seeking opportunities to apply core engineering and development skills.",
            location="Bengaluru, India",
            skills=json.dumps(["Python", "JavaScript", "SQL", "Git", "Problem Solving"])
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    skills_list = []
    if profile.skills:
        try:
            skills_list = json.loads(profile.skills)
        except Exception:
            skills_list = [s.strip() for s in profile.skills.split(",") if s.strip()]

    # Find active resume
    active_resume = db.query(Resume).filter(
        Resume.owner_id == current_user.id,
        Resume.is_active == True
    ).order_by(Resume.id.desc()).first()

    if not active_resume:
        active_resume = db.query(Resume).filter(
            Resume.owner_id == current_user.id
        ).order_by(Resume.id.desc()).first()

    return {
        "id": profile.id,
        "user_id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "phone": profile.phone or "",
        "university": profile.university or "",
        "degree": profile.degree or "",
        "graduation_year": profile.graduation_year or "",
        "target_role": profile.target_role or "Software Engineer Intern",
        "bio": profile.bio or "",
        "location": profile.location or "",
        "github_url": profile.github_url or "",
        "linkedin_url": profile.linkedin_url or "",
        "portfolio_url": profile.portfolio_url or "",
        "skills": skills_list,
        "active_resume_id": active_resume.id if active_resume else None,
        "active_resume_filename": active_resume.filename if active_resume else None
    }


@router.put("/me")
def update_my_profile(
    data: ProfileUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if not profile:
        profile = StudentProfile(user_id=current_user.id)
        db.add(profile)

    if data.phone is not None:
        profile.phone = data.phone
    if data.university is not None:
        profile.university = data.university
    if data.degree is not None:
        profile.degree = data.degree
    if data.graduation_year is not None:
        profile.graduation_year = data.graduation_year
    if data.target_role is not None:
        profile.target_role = data.target_role
    if data.bio is not None:
        profile.bio = data.bio
    if data.location is not None:
        profile.location = data.location
    if data.github_url is not None:
        profile.github_url = data.github_url
    if data.linkedin_url is not None:
        profile.linkedin_url = data.linkedin_url
    if data.portfolio_url is not None:
        profile.portfolio_url = data.portfolio_url
    if data.skills is not None:
        profile.skills = json.dumps(data.skills)

    db.commit()
    db.refresh(profile)

    return {"message": "Profile updated successfully"}
