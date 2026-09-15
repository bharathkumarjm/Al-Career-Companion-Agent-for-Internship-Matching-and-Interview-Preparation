from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.progress import LearningProgress
from app.models.user import User

from app.schemas.progress import (
    ProgressCreate,
    ProgressUpdate,
    ProgressResponse
)

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/progress",
    tags=["Learning Progress"]
)


# ==========================================
# CREATE LEARNING PROGRESS
# ==========================================

@router.post(
    "/",
    response_model=ProgressResponse
)
def create_progress(
    progress_data: ProgressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if not 0 <= progress_data.progress_percentage <= 100:
        raise HTTPException(
            status_code=400,
            detail="Progress percentage must be between 0 and 100"
        )

    if progress_data.progress_percentage == 0:
        status = "not_started"
    elif progress_data.progress_percentage == 100:
        status = "completed"
    else:
        status = "in_progress"

    progress = LearningProgress(
        intern_id=current_user.id,
        course_name=progress_data.course_name,
        description=progress_data.description,
        progress_percentage=progress_data.progress_percentage,
        status=status
    )

    db.add(progress)
    db.commit()
    db.refresh(progress)

    return progress


# ==========================================
# GET ALL LEARNING PROGRESS
# ==========================================

@router.get(
    "/",
    response_model=list[ProgressResponse]
)
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return db.query(LearningProgress).filter(
        LearningProgress.intern_id == current_user.id
    ).all()


# ==========================================
# GET SINGLE PROGRESS
# ==========================================

@router.get(
    "/{progress_id}",
    response_model=ProgressResponse
)
def get_single_progress(
    progress_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    progress = db.query(LearningProgress).filter(
        LearningProgress.id == progress_id,
        LearningProgress.intern_id == current_user.id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Learning progress not found"
        )

    return progress


# ==========================================
# UPDATE LEARNING PROGRESS
# ==========================================

@router.put(
    "/{progress_id}",
    response_model=ProgressResponse
)
def update_progress(
    progress_id: int,
    progress_data: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if not 0 <= progress_data.progress_percentage <= 100:
        raise HTTPException(
            status_code=400,
            detail="Progress percentage must be between 0 and 100"
        )

    progress = db.query(LearningProgress).filter(
        LearningProgress.id == progress_id,
        LearningProgress.intern_id == current_user.id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Learning progress not found"
        )

    progress.progress_percentage = (
        progress_data.progress_percentage
    )

    if progress_data.status:
        progress.status = progress_data.status
    else:
        if progress_data.progress_percentage == 0:
            progress.status = "not_started"
        elif progress_data.progress_percentage == 100:
            progress.status = "completed"
        else:
            progress.status = "in_progress"

    db.commit()
    db.refresh(progress)

    return progress