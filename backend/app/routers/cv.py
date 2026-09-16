import os
import json

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.analysis import ResumeAnalysis
from app.models.cv import CV

from app.schemas.cv import CVResponse

from app.utils.auth import get_current_user

from app.services.cv_generator import generate_cv_pdf


router = APIRouter(
    prefix="/cv",
    tags=["CV Generation"]
)


# ============================================================
# GENERATE CV
# ============================================================

@router.post(
    "/{resume_id}/generate",
    response_model=CVResponse
)
def generate_cv(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # 1. Find resume
    # --------------------------------------------------------

    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.owner_id == current_user.id
    ).first()

    if not resume:

        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    # --------------------------------------------------------
    # 2. Find resume analysis
    # --------------------------------------------------------

    analysis = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.resume_id == resume_id
    ).first()

    if not analysis:

        raise HTTPException(
            status_code=404,
            detail="Resume analysis not found. Analyze the resume first."
        )

    # --------------------------------------------------------
    # 3. Convert stored JSON fields
    # --------------------------------------------------------

    try:

        skills = json.loads(analysis.skills) if analysis.skills else []
        education = json.loads(analysis.education) if analysis.education else []
        experience = json.loads(analysis.experience) if analysis.experience else []
        projects = json.loads(analysis.projects) if analysis.projects else []
        certifications = (
            json.loads(analysis.certifications)
            if analysis.certifications
            else []
        )

    except json.JSONDecodeError:

        raise HTTPException(
            status_code=500,
            detail="Stored resume analysis contains invalid JSON"
        )

    # --------------------------------------------------------
    # 4. Generate PDF
    # --------------------------------------------------------

    try:

        filename = f"CV_{current_user.id}_{resume_id}.pdf"

        file_path = generate_cv_pdf(
            filename=filename,
            summary=analysis.summary,
            skills=skills,
            education=education,
            experience=experience,
            projects=projects,
            certifications=certifications,
            career_recommendation=analysis.career_recommendation
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not generate CV: {str(e)}"
        )

    # --------------------------------------------------------
    # 5. Check if CV already exists
    # --------------------------------------------------------

    existing_cv = db.query(CV).filter(
        CV.resume_id == resume_id,
        CV.owner_id == current_user.id
    ).first()

    if existing_cv:

        existing_cv.file_path = file_path
        existing_cv.filename = filename

        db.commit()
        db.refresh(existing_cv)

        return existing_cv

    # --------------------------------------------------------
    # 6. Save CV information
    # --------------------------------------------------------

    cv = CV(
        resume_id=resume_id,
        owner_id=current_user.id,
        file_path=file_path,
        filename=filename
    )

    db.add(cv)
    db.commit()
    db.refresh(cv)

    return cv


# ============================================================
# DOWNLOAD CV
# ============================================================

@router.get(
    "/{resume_id}/download"
)
def download_cv(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    cv = db.query(CV).filter(
        CV.resume_id == resume_id,
        CV.owner_id == current_user.id
    ).first()

    if not cv:

        raise HTTPException(
            status_code=404,
            detail="Generated CV not found. Generate the CV first."
        )

    if not os.path.exists(cv.file_path):

        raise HTTPException(
            status_code=404,
            detail="CV file does not exist"
        )

    return FileResponse(
        path=cv.file_path,
        media_type="application/pdf",
        filename=cv.filename
    )