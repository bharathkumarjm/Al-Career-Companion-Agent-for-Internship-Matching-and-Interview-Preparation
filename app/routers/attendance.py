from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.attendance import Attendance
from app.models.user import User

from app.schemas.attendance import (
    AttendanceCreate,
    AttendanceResponse
)

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/attendance",
    tags=["Attendance"]
)


# ==========================================
# MARK ATTENDANCE
# ==========================================

@router.post(
    "/",
    response_model=AttendanceResponse
)
def mark_attendance(
    attendance_data: AttendanceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    attendance = Attendance(
        intern_id=attendance_data.intern_id,
        date=attendance_data.date,
        status=attendance_data.status
    )

    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    return attendance


# ==========================================
# GET MY ATTENDANCE
# ==========================================

@router.get(
    "/",
    response_model=list[AttendanceResponse]
)
def get_my_attendance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    attendance = db.query(Attendance).filter(
        Attendance.intern_id == current_user.id
    ).all()

    return attendance


# ==========================================
# GET ATTENDANCE BY INTERN
# ==========================================

@router.get(
    "/intern/{intern_id}",
    response_model=list[AttendanceResponse]
)
def get_intern_attendance(
    intern_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    attendance = db.query(Attendance).filter(
        Attendance.intern_id == intern_id
    ).all()

    if not attendance:
        raise HTTPException(
            status_code=404,
            detail="Attendance not found"
        )

    return attendance