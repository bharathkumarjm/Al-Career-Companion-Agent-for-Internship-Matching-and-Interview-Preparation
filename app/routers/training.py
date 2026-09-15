from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.training import TrainingSession
from app.models.user import User

from app.schemas.training import (
    TrainingSessionCreate,
    TrainingSessionResponse
)

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/training",
    tags=["Training Sessions"]
)


# ==========================================
# CREATE TRAINING SESSION
# ==========================================

@router.post(
    "/",
    response_model=TrainingSessionResponse
)
def create_training_session(
    training_data: TrainingSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    training = TrainingSession(
        title=training_data.title,
        description=training_data.description,
        date=training_data.date,
        time=training_data.time,
        trainer=training_data.trainer,
        status="scheduled"
    )

    db.add(training)
    db.commit()
    db.refresh(training)

    return training


# ==========================================
# GET ALL TRAINING SESSIONS
# ==========================================

@router.get(
    "/",
    response_model=list[TrainingSessionResponse]
)
def get_training_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return db.query(TrainingSession).all()


# ==========================================
# GET SINGLE TRAINING SESSION
# ==========================================

@router.get(
    "/{training_id}",
    response_model=TrainingSessionResponse
)
def get_training_session(
    training_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    training = db.query(TrainingSession).filter(
        TrainingSession.id == training_id
    ).first()

    if not training:
        raise HTTPException(
            status_code=404,
            detail="Training session not found"
        )

    return training