from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.code_review import CodeReview
from app.models.submission import Submission
from app.models.user import User

from app.schemas.code_review import (
    CodeReviewCreate,
    CodeReviewResponse
)

from app.utils.auth import get_current_user
from app.services.groq_service import review_code


router = APIRouter(
    prefix="/code-reviews",
    tags=["AI Code Review"]
)


# ==========================================
# CREATE AI CODE REVIEW
# ==========================================

@router.post(
    "/",
    response_model=CodeReviewResponse
)
def create_code_review(
    review_data: CodeReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Find submission belonging to current intern
    submission = db.query(Submission).filter(
        Submission.id == review_data.submission_id,
        Submission.intern_id == current_user.id
    ).first()

    if not submission:
        raise HTTPException(
            status_code=404,
            detail="Submission not found"
        )

    if not submission.submission_text:
        raise HTTPException(
            status_code=400,
            detail="Submission does not contain code"
        )

    try:

        # Send code to Groq
        result = review_code(
            submission.submission_text
        )

        # Save AI review
        code_review = CodeReview(
            submission_id=submission.id,
            score=result["score"],
            feedback=result["feedback"],
            suggestions=result["suggestions"]
        )

        db.add(code_review)
        db.commit()
        db.refresh(code_review)

        return code_review

    except Exception as e:

        db.rollback()

        print("========== CODE REVIEW ERROR ==========")
        print(type(e).__name__)
        print(str(e))
        print("=======================================")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ==========================================
# GET CODE REVIEW
# ==========================================

@router.get(
    "/{review_id}",
    response_model=CodeReviewResponse
)
def get_code_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    review = db.query(CodeReview).join(
        Submission,
        CodeReview.submission_id == Submission.id
    ).filter(
        CodeReview.id == review_id,
        Submission.intern_id == current_user.id
    ).first()

    if not review:
        raise HTTPException(
            status_code=404,
            detail="Code review not found"
        )

    return review