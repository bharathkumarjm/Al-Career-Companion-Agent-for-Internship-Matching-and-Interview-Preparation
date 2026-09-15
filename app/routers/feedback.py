from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db

from app.models.feedback import MentorFeedback
from app.models.submission import Submission
from app.models.task import Task
from app.models.project import Project
from app.models.user import User

from app.schemas.feedback import (
    FeedbackCreate,
    FeedbackResponse
)

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/feedback",
    tags=["Mentor Feedback"]
)


# ==========================================
# CREATE MENTOR FEEDBACK
# ==========================================

@router.post(
    "/",
    response_model=FeedbackResponse
)
def create_feedback(
    feedback_data: FeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ------------------------------------------
    # Find submission
    # ------------------------------------------

    submission = db.query(Submission).filter(
        Submission.id == feedback_data.submission_id
    ).first()

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="Submission not found"
        )

    # ------------------------------------------
    # Find task
    # ------------------------------------------

    task = db.query(Task).filter(
        Task.id == submission.task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # ------------------------------------------
    # Find project
    # ------------------------------------------

    project = db.query(Project).filter(
        Project.id == task.project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # ------------------------------------------
    # Validate rating
    # ------------------------------------------

    if feedback_data.rating is not None:

        if feedback_data.rating < 1 or feedback_data.rating > 5:
            raise HTTPException(
                status_code=400,
                detail="Rating must be between 1 and 5"
            )

    # ------------------------------------------
    # Create feedback
    # ------------------------------------------
    #
    # For the current testing setup, the logged-in
    # user is used as the mentor_id.
    #
    # Later, when you create separate mentor users,
    # you can add the mentor-role restriction here.
    # ------------------------------------------

    feedback = MentorFeedback(
        submission_id=submission.id,
        mentor_id=current_user.id,
        feedback=feedback_data.feedback,
        rating=feedback_data.rating
    )

    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return feedback


# ==========================================
# GET FEEDBACK FOR SUBMISSION
# ==========================================

@router.get(
    "/submission/{submission_id}",
    response_model=list[FeedbackResponse]
)
def get_submission_feedback(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # ------------------------------------------
    # Find submission
    # ------------------------------------------

    submission = db.query(Submission).filter(
        Submission.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="Submission not found"
        )

    # ------------------------------------------
    # Intern can see feedback for their
    # own submission
    # ------------------------------------------

    if submission.intern_id == current_user.id:

        return db.query(MentorFeedback).filter(
            MentorFeedback.submission_id == submission_id
        ).all()

    # ------------------------------------------
    # Find task
    # ------------------------------------------

    task = db.query(Task).filter(
        Task.id == submission.task_id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # ------------------------------------------
    # Find project
    # ------------------------------------------

    project = db.query(Project).filter(
        Project.id == task.project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # ------------------------------------------
    # Mentor can see feedback for their project
    # ------------------------------------------

    if project.mentor_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

    return db.query(MentorFeedback).filter(
        MentorFeedback.submission_id == submission_id
    ).all()