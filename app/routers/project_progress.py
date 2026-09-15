from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project_progress import ProjectProgress
from app.models.project import Project
from app.models.user import User

from app.schemas.project_progress import (
    ProjectProgressCreate,
    ProjectProgressUpdate,
    ProjectProgressResponse
)

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/project-progress",
    tags=["Project Progress"]
)


# ==========================================
# CREATE PROJECT PROGRESS
# ==========================================

@router.post(
    "/",
    response_model=ProjectProgressResponse
)
def create_project_progress(
    progress_data: ProjectProgressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Check project
    project = db.query(Project).filter(
        Project.id == progress_data.project_id,
        Project.intern_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    # Validate percentage
    if not 0 <= progress_data.progress_percentage <= 100:
        raise HTTPException(
            status_code=400,
            detail="Progress percentage must be between 0 and 100"
        )

    # Determine status
    if progress_data.progress_percentage == 0:
        status = "not_started"
    elif progress_data.progress_percentage == 100:
        status = "completed"
    else:
        status = "in_progress"

    progress = ProjectProgress(
        project_id=progress_data.project_id,
        intern_id=current_user.id,
        progress_percentage=progress_data.progress_percentage,
        status=status
    )

    db.add(progress)
    db.commit()
    db.refresh(progress)

    return progress


# ==========================================
# GET MY PROJECT PROGRESS
# ==========================================

@router.get(
    "/",
    response_model=list[ProjectProgressResponse]
)
def get_project_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return db.query(ProjectProgress).filter(
        ProjectProgress.intern_id == current_user.id
    ).all()


# ==========================================
# GET SINGLE PROJECT PROGRESS
# ==========================================

@router.get(
    "/{progress_id}",
    response_model=ProjectProgressResponse
)
def get_single_project_progress(
    progress_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    progress = db.query(ProjectProgress).filter(
        ProjectProgress.id == progress_id,
        ProjectProgress.intern_id == current_user.id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Project progress not found"
        )

    return progress


# ==========================================
# UPDATE PROJECT PROGRESS
# ==========================================

@router.put(
    "/{progress_id}",
    response_model=ProjectProgressResponse
)
def update_project_progress(
    progress_id: int,
    progress_data: ProjectProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if not 0 <= progress_data.progress_percentage <= 100:
        raise HTTPException(
            status_code=400,
            detail="Progress percentage must be between 0 and 100"
        )

    progress = db.query(ProjectProgress).filter(
        ProjectProgress.id == progress_id,
        ProjectProgress.intern_id == current_user.id
    ).first()

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Project progress not found"
        )

    progress.progress_percentage = (
        progress_data.progress_percentage
    )

    if progress_data.progress_percentage == 0:
        progress.status = "not_started"
    elif progress_data.progress_percentage == 100:
        progress.status = "completed"
    else:
        progress.status = "in_progress"

    db.commit()
    db.refresh(progress)

    return progress