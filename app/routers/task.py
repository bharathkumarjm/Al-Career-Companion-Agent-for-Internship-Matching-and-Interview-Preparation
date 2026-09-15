from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.task import Task
from app.models.user import User
from app.models.project import Project

from app.schemas.task import (
    TaskCreate,
    TaskUpdate,
    TaskResponse
)

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"]
)


# ==========================================
# CREATE TASK
# ==========================================

@router.post(
    "/",
    response_model=TaskResponse
)
def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Check whether project exists
    project = db.query(Project).filter(
        Project.id == task_data.project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    task = Task(
        title=task_data.title,
        description=task_data.description,
        project_id=task_data.project_id,
        intern_id=task_data.intern_id,
        status="pending"
    )

    db.add(task)
    db.commit()
    db.refresh(task)

    return task


# ==========================================
# GET ALL TASKS
# ==========================================

@router.get(
    "/",
    response_model=list[TaskResponse]
)
def get_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    tasks = db.query(Task).filter(
        Task.intern_id == current_user.id
    ).all()

    return tasks


# ==========================================
# GET SINGLE TASK
# ==========================================

@router.get(
    "/{task_id}",
    response_model=TaskResponse
)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    task = db.query(Task).filter(
        Task.id == task_id,
        Task.intern_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    return task


# ==========================================
# UPDATE TASK STATUS
# ==========================================

@router.put(
    "/{task_id}",
    response_model=TaskResponse
)
def update_task(
    task_id: int,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Find task belonging to current intern
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.intern_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=404,
            detail="Task not found"
        )

    # Allow only valid statuses
    allowed_statuses = [
        "pending",
        "in_progress",
        "completed"
    ]

    if task_data.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Use pending, in_progress, or completed"
        )

    task.status = task_data.status

    db.commit()
    db.refresh(task)

    return task