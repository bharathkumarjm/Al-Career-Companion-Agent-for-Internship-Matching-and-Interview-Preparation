import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.student_profile import StudentProfile
from app.utils.auth import get_current_user
from app.services.groq_service import tailor_resume, generate_cover_letter
from app.services.cv_generator import generate_cv_pdf_bytes


router = APIRouter(
    prefix="/api/customization",
    tags=["Resume & Cover Letter Customization"]
)


class TailorResumeRequest(BaseModel):
    target_role: str
    job_description: Optional[str] = ""
    resume_id: Optional[int] = None


class CoverLetterRequest(BaseModel):
    company: str
    role: str
    job_description: Optional[str] = ""
    tone: Optional[str] = "professional"  # professional, enthusiastic, confident
    resume_id: Optional[int] = None


def _get_candidate_resume_data(user_id: int, resume_id: Optional[int], db: Session) -> Dict[str, Any]:
    if resume_id:
        resume = db.query(Resume).filter(
            Resume.id == resume_id,
            Resume.owner_id == user_id
        ).first()
    else:
        resume = db.query(Resume).filter(
            Resume.owner_id == user_id,
            Resume.is_active == True
        ).order_by(Resume.id.desc()).first()

        if not resume:
            resume = db.query(Resume).filter(
                Resume.owner_id == user_id
            ).order_by(Resume.id.desc()).first()

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()

    data = {
        "summary": "",
        "skills": [],
        "experience": [],
        "projects": [],
        "personal_info": {}
    }

    if resume and resume.parsed_data:
        try:
            data = json.loads(resume.parsed_data)
        except Exception:
            pass

    if not data.get("summary") and resume and resume.extracted_text:
        data["summary"] = resume.extracted_text[:300]

    if profile:
        p_info = data.get("personal_info", {})
        if not p_info.get("name"):
            user = db.query(User).filter(User.id == user_id).first()
            p_info["name"] = user.name if user else "Student"
        p_info["phone"] = profile.phone or p_info.get("phone", "")
        p_info["linkedin"] = profile.linkedin_url or p_info.get("linkedin", "")
        p_info["github"] = profile.github_url or p_info.get("github", "")
        data["personal_info"] = p_info

        if not data.get("skills") and profile.skills:
            try:
                data["skills"] = json.loads(profile.skills)
            except Exception:
                data["skills"] = [profile.skills]

    return data


@router.post("/tailor-resume")
def customize_resume(
    payload: TailorResumeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_role = payload.target_role.strip()
    if not target_role:
        raise HTTPException(status_code=400, detail="Target role is required")

    resume_data = _get_candidate_resume_data(current_user.id, payload.resume_id, db)

    result = tailor_resume(
        resume_data=resume_data,
        target_role=target_role,
        job_description=payload.job_description or ""
    )

    return result


@router.post("/generate-cover-letter")
def build_cover_letter(
    payload: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    company = payload.company.strip()
    role = payload.role.strip()
    if not company or not role:
        raise HTTPException(status_code=400, detail="Company and Role are required")

    resume_data = _get_candidate_resume_data(current_user.id, payload.resume_id, db)

    # Ensure applicant name is set
    if not resume_data.get("personal_info", {}).get("name"):
        resume_data["personal_info"] = resume_data.get("personal_info", {})
        resume_data["personal_info"]["name"] = current_user.name

    result = generate_cover_letter(
        candidate_data=resume_data,
        company=company,
        role=role,
        job_description=payload.job_description or "",
        tone=payload.tone or "professional"
    )

    return result


@router.post("/download-cv-pdf")
def export_cv_pdf_endpoint(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Generate and return a professional CV PDF file directly from customizer data."""
    try:
        template = payload.get("template", "modern")
        pdf_bytes = generate_cv_pdf_bytes(payload, template=template)

        name = payload.get("fullName") or payload.get("name") or current_user.name or "Candidate"
        safe_name = "".join(c for c in name if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_")
        filename = f"{safe_name}_Resume_CV.pdf"

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate CV PDF: {str(e)}")

