from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.project import Project
from app.models.task import Task

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/")
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    resumes = db.query(Resume).filter(
        Resume.owner_id == current_user.id
    ).all()

    projects = db.query(Project).filter(
        Project.intern_id == current_user.id
    ).all()

    tasks = db.query(Task).filter(
        Task.intern_id == current_user.id
    ).all()

    completed_tasks = [
        task for task in tasks
        if task.status == "completed"
    ]

    pending_tasks = [
        task for task in tasks
        if task.status == "pending"
    ]

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role
        },

        "resume": {
            "total": len(resumes)
        },

        "projects": {
            "total": len(projects),
            "completed": len([
                p for p in projects
                if p.status == "completed"
            ]),
            "pending": len([
                p for p in projects
                if p.status == "pending"
            ])
        },

        "tasks": {
            "total": len(tasks),
            "completed": len(completed_tasks),
            "pending": len(pending_tasks)
        }
    }