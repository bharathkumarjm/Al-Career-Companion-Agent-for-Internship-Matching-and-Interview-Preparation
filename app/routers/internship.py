from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.internship import Internship
from app.models.user import User

from app.schemas.internship import (
    InternshipCreate,
    InternshipResponse
)

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/internships",
    tags=["Internships"]
)


# ==========================================
# CREATE INTERNSHIP
# ==========================================

@router.post(
    "/",
    response_model=InternshipResponse
)
def create_internship(
    internship_data: InternshipCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    internship = Internship(
        title=internship_data.title,
        description=internship_data.description,
        required_skills=internship_data.required_skills,
        duration=internship_data.duration,
        status="active"
    )

    db.add(internship)
    db.commit()
    db.refresh(internship)

    return internship


# ==========================================
# GET ALL INTERNSHIPS
# ==========================================

@router.get(
    "/",
    response_model=list[InternshipResponse]
)
def get_internships(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return db.query(Internship).filter(
        Internship.status == "active"
    ).all()


# ==========================================
# GET SINGLE INTERNSHIP
# ==========================================

@router.get(
    "/{internship_id}",
    response_model=InternshipResponse
)
def get_internship(
    internship_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    internship = db.query(Internship).filter(
        Internship.id == internship_id,
        Internship.status == "active"
    ).first()

    if not internship:
        raise HTTPException(
            status_code=404,
            detail="Internship not found"
        )

    return internship