from typing import Any, Dict, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.models.application import Application
from app.utils.auth import get_current_user

router = APIRouter(
    prefix="/api/applications",
    tags=["Application Tracking & Management"]
)


class ApplicationCreateSchema(BaseModel):
    company: str
    role: str
    location: Optional[str] = "Remote"
    stipend: Optional[str] = "Competitive"
    status: Optional[str] = "Applied"  # Applied, Screening, Interviewing, Offered, Rejected, Accepted
    applied_date: Optional[str] = None
    deadline: Optional[str] = None
    interview_date: Optional[str] = None
    notes: Optional[str] = None
    job_link: Optional[str] = None
    match_score: Optional[int] = None


class ApplicationUpdateSchema(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    location: Optional[str] = None
    stipend: Optional[str] = None
    status: Optional[str] = None
    applied_date: Optional[str] = None
    deadline: Optional[str] = None
    interview_date: Optional[str] = None
    notes: Optional[str] = None
    job_link: Optional[str] = None
    match_score: Optional[int] = None


def _format_app(app: Application) -> Dict[str, Any]:
    return {
        "id": app.id,
        "user_id": app.user_id,
        "company": app.company,
        "role": app.role,
        "location": app.location or "Remote",
        "stipend": app.stipend or "Competitive",
        "status": app.status or "Applied",
        "applied_date": app.applied_date or (app.created_at.strftime("%Y-%m-%d") if app.created_at else ""),
        "deadline": app.deadline or "",
        "interview_date": app.interview_date or "",
        "notes": app.notes or "",
        "job_link": app.job_link or "",
        "match_score": app.match_score,
        "created_at": app.created_at.strftime("%b %d, %Y") if app.created_at else ""
    }


@router.get("/")
def get_user_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).filter(
        Application.user_id == current_user.id
    ).order_by(Application.id.desc()).all()

    # If new user has zero applications, seed 2 demo applications so the Kanban board looks great immediately!
    if not apps:
        demo1 = Application(
            user_id=current_user.id,
            company="OpenAI Labs",
            role="Backend Developer Intern",
            location="Hyderabad (Hybrid)",
            stipend="₹35,000 / month",
            status="Interviewing",
            applied_date=datetime.now().strftime("%Y-%m-%d"),
            interview_date="Next Tuesday at 2:00 PM",
            notes="Technical coding round cleared. System design next.",
            match_score=94
        )
        demo2 = Application(
            user_id=current_user.id,
            company="CortexAI Systems",
            role="Generative AI & LLM Intern",
            location="Bengaluru (Onsite)",
            stipend="₹45,000 / month",
            status="Applied",
            applied_date=datetime.now().strftime("%Y-%m-%d"),
            notes="Applied through company portal with tailored resume.",
            match_score=88
        )
        db.add_all([demo1, demo2])
        db.commit()
        apps = [demo1, demo2]

    return [_format_app(a) for a in apps]


@router.get("/stats")
def get_application_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).filter(Application.user_id == current_user.id).all()
    stats = {
        "total": len(apps),
        "applied": 0,
        "screening": 0,
        "interviewing": 0,
        "offered": 0,
        "rejected": 0,
        "accepted": 0
    }
    for a in apps:
        s = (a.status or "applied").lower()
        if s in stats:
            stats[s] += 1
        else:
            stats["applied"] += 1

    return stats


@router.post("/")
def create_application(
    payload: ApplicationCreateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comp = payload.company.strip()
    role = payload.role.strip()

    # Deduplicate: check if application already exists for this company & role
    existing = db.query(Application).filter(
        Application.user_id == current_user.id,
        Application.company.ilike(comp),
        Application.role.ilike(role)
    ).first()

    if existing:
        if payload.match_score is not None:
            existing.match_score = payload.match_score
        if payload.stipend and payload.stipend != "Competitive":
            existing.stipend = payload.stipend
        if payload.status and payload.status != "Applied":
            existing.status = payload.status
        db.commit()
        db.refresh(existing)
        return _format_app(existing)

    app = Application(
        user_id=current_user.id,
        company=comp,
        role=role,
        location=payload.location or "Remote",
        stipend=payload.stipend or "Competitive",
        status=payload.status or "Applied",
        applied_date=payload.applied_date or datetime.now().strftime("%Y-%m-%d"),
        deadline=payload.deadline,
        interview_date=payload.interview_date,
        notes=payload.notes,
        job_link=payload.job_link,
        match_score=payload.match_score
    )
    db.add(app)
    db.commit()
    db.refresh(app)

    return _format_app(app)


@router.post("/clean-duplicates")
def clean_duplicate_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).filter(
        Application.user_id == current_user.id
    ).order_by(Application.id.asc()).all()

    seen = {}
    removed = 0
    for a in apps:
        key = (a.company.strip().lower(), a.role.strip().lower())
        if key in seen:
            db.delete(a)
            removed += 1
        else:
            seen[key] = a
    db.commit()
    return {"message": f"Successfully removed {removed} duplicates.", "removed": removed}


@router.post("/seed-demo")
def seed_demo_pipeline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Clear user applications and seed a balanced multi-stage recruitment pipeline
    db.query(Application).filter(Application.user_id == current_user.id).delete()

    demo_apps = [
        Application(
            user_id=current_user.id,
            company="OpenAI Labs",
            role="Backend Developer Intern",
            location="Hyderabad (Hybrid)",
            stipend="₹45,000 / month",
            status="Interviewing",
            applied_date=datetime.now().strftime("%Y-%m-%d"),
            interview_date="Thursday, 2:30 PM (System Architecture Round)",
            notes="Passed HackerRank coding round with 100%. Live technical pairing scheduled.",
            match_score=98
        ),
        Application(
            user_id=current_user.id,
            company="Microsoft",
            role="Cloud & AI Engineer Intern",
            location="Bengaluru (Hybrid)",
            stipend="₹40,000 / month",
            status="Screening",
            applied_date=datetime.now().strftime("%Y-%m-%d"),
            interview_date="Online Assessment due Friday",
            notes="Recruiter contacted via LinkedIn. Completing Azure Cloud & Algorithms test.",
            match_score=92
        ),
        Application(
            user_id=current_user.id,
            company="Stripe Labs",
            role="APIs & Infrastructure Intern",
            location="Remote",
            stipend="₹50,000 / month",
            status="Offered",
            applied_date=datetime.now().strftime("%Y-%m-%d"),
            interview_date="Completed Final Round",
            notes="Official offer letter received! ₹50,000/mo stipend + mentors assigned. Reviewing offer.",
            match_score=95
        ),
        Application(
            user_id=current_user.id,
            company="TechNova Cloud",
            role="Full Stack Developer Intern",
            location="Pune (Remote)",
            stipend="₹30,000 / month",
            status="Applied",
            applied_date=datetime.now().strftime("%Y-%m-%d"),
            notes="Applied through company portal with tailored Full Stack & React resume.",
            match_score=89
        ),
        Application(
            user_id=current_user.id,
            company="Quantix Labs",
            role="Data Science & ML Intern",
            location="Bengaluru (Onsite)",
            stipend="₹35,000 / month",
            status="Applied",
            applied_date=datetime.now().strftime("%Y-%m-%d"),
            notes="Resume screened for Python, SQL, and PyTorch keywords.",
            match_score=87
        ),
    ]
    db.add_all(demo_apps)
    db.commit()
    return {"message": "Balanced multi-stage demo pipeline created!", "count": len(demo_apps)}


@router.put("/{application_id}")
def update_application(
    application_id: int,
    payload: ApplicationUpdateSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    dict_updates = payload.dict(exclude_unset=True)
    for field, val in dict_updates.items():
        if val is not None:
            setattr(app, field, val)

    db.commit()
    db.refresh(app)

    return _format_app(app)


@router.delete("/{application_id}")
def delete_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(
        Application.id == application_id,
        Application.user_id == current_user.id
    ).first()

    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    db.delete(app)
    db.commit()

    return {"message": "Application removed successfully"}
