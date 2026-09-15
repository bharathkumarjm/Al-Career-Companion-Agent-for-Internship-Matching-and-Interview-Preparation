from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse
from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/projects",
    tags=["Projects"]
)


@router.post("/", response_model=ProjectResponse)
def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = Project(
        title=project_data.title,
        description=project_data.description,
        mentor_id=project_data.mentor_id,
        intern_id=project_data.intern_id,
        status="pending"
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    return project


@router.get("/", response_model=list[ProjectResponse])
def get_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(Project).filter(
        Project.intern_id == current_user.id
    ).all()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.intern_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    return project