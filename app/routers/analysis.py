from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.analysis import ResumeAnalysis
from app.models.resume import Resume
from app.models.user import User

from app.schemas.analysis import ResumeAnalysisResponse

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/analysis",
    tags=["Resume Analysis"]
)


# ==========================================
# GET RESUME ANALYSIS
# ==========================================

@router.get(
    "/{resume_id}",
    response_model=ResumeAnalysisResponse
)
def get_resume_analysis(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Check whether resume belongs to current user
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.owner_id == current_user.id
    ).first()

    if not resume:
        raise HTTPException(
            status_code=404,
            detail="Resume not found"
        )

    # Get analysis
    analysis = db.query(ResumeAnalysis).filter(
        ResumeAnalysis.resume_id == resume_id
    ).first()

    if not analysis:
        raise HTTPException(
            status_code=404,
            detail="Resume analysis not found"
        )

    return analysis