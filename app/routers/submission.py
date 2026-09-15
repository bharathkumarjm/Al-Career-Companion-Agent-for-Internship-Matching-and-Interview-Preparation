from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.submission import Submission
from app.models.task import Task
from app.models.user import User

from app.schemas.submission import (
    SubmissionCreate,
    SubmissionResponse
)

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/submissions",
    tags=["Submissions"]
)


# ==========================================
# CREATE SUBMISSION
# ==========================================

@router.post(
    "/",
    response_model=SubmissionResponse
)
def create_submission(
    submission_data: SubmissionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Check task
    task = db.query(Task).filter(
        Task.id == submission_data.task_id,
        Task.intern_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    submission = Submission(
        task_id=submission_data.task_id,
        intern_id=current_user.id,
        submission_text=submission_data.submission_text,
        status="submitted"
    )

    db.add(submission)
    db.commit()
    db.refresh(submission)

    return submission


# ==========================================
# GET ALL SUBMISSIONS
# ==========================================

@router.get(
    "/",
    response_model=list[SubmissionResponse]
)
def get_submissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    submissions = db.query(Submission).filter(
        Submission.intern_id == current_user.id
    ).all()

    return submissions


# ==========================================
# GET SINGLE SUBMISSION
# ==========================================

@router.get(
    "/{submission_id}",
    response_model=SubmissionResponse
)
def get_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    submission = db.query(Submission).filter(
        Submission.id == submission_id,
        Submission.intern_id == current_user.id
    ).first()

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="Submission not found"
        )

    return submission