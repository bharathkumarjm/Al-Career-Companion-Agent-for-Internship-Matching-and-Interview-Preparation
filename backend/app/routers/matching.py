import json
import re
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.analysis import ResumeAnalysis
from app.models.internship import Internship
from app.utils.auth import get_current_user
from app.services.internship_dataset import seed_internships_if_empty
from app.services.rag_matcher import RAGInternshipMatcher, InternshipVectorStore

router = APIRouter(
    prefix="/matching",
    tags=["Job-Resume Matching & Compatibility"]
)


def _clean_skills(skills_input: Any) -> List[str]:
    if not skills_input:
        return []
    if isinstance(skills_input, list):
        items = skills_input
    elif isinstance(skills_input, dict):
        items = skills_input.get("technical_skills", []) + skills_input.get("tools_frameworks", [])
    elif isinstance(skills_input, str):
        try:
            parsed = json.loads(skills_input)
            if isinstance(parsed, list):
                items = parsed
            elif isinstance(parsed, dict):
                items = parsed.get("technical_skills", []) + parsed.get("tools_frameworks", [])
            else:
                items = [parsed]
        except Exception:
            items = [s.strip() for s in re.split(r"[,;|]+", skills_input) if s.strip()]
    else:
        items = [str(skills_input)]

    flattened = []
    for item in items:
        if isinstance(item, str):
            for part in re.split(r"[,;|]+", item):
                cleaned = part.strip()
                if cleaned:
                    flattened.append(cleaned)
        elif item:
            flattened.append(str(item))
    return flattened


def _calculate_compatibility(candidate_skills: List[str], candidate_text: str, internship: Internship) -> Dict[str, Any]:
    norm_candidate_skills = {re.sub(r"[^a-z0-9]+", "", s.lower()): s for s in candidate_skills if s}
    
    req_skills_raw = [s.strip() for s in re.split(r"[,;|/]+", internship.required_skills or "") if s.strip()]
    pref_skills_raw = [s.strip() for s in re.split(r"[,;|/]+", getattr(internship, "preferred_skills", "") or "") if s.strip()]
    all_job_skills = req_skills_raw + pref_skills_raw

    matched_skills = []
    missing_skills = []

    for skill in req_skills_raw:
        norm_req = re.sub(r"[^a-z0-9]+", "", skill.lower())
        matched = False
        for c_norm, orig in norm_candidate_skills.items():
            if norm_req in c_norm or c_norm in norm_req:
                matched_skills.append(skill)
                matched = True
                break
        if not matched:
            missing_skills.append(skill)

    total_req = max(1, len(req_skills_raw))
    skills_score = int(round((len(matched_skills) / total_req) * 100))

    # Domain / title relevance
    title = (internship.title or "").lower()
    domain = (getattr(internship, "domain", "") or "").lower()
    text_lower = candidate_text.lower()
    
    domain_match = 70
    if domain in text_lower:
        domain_match += 20
    for word in title.split():
        if len(word) > 3 and word in text_lower:
            domain_match += 10
            break
    domain_match = min(100, domain_match)

    # Weighted Overall Score
    overall = int(round((0.60 * skills_score) + (0.40 * domain_match)))
    overall = max(35, min(98, overall))

    # Generate fit reasoning
    if matched_skills:
        reason = f"Strong match for {internship.title}! Your expertise in {', '.join(matched_skills[:3])} directly meets their core requirements."
    else:
        reason = f"Relevant entry-level opportunity for {internship.title}. Developing skills like {', '.join(missing_skills[:2])} will make you an exceptional candidate."

    return {
        "internship_id": internship.id,
        "title": internship.title,
        "company": getattr(internship, "company", "TechCorp") or "TechCorp",
        "domain": getattr(internship, "domain", "Software Engineering") or "Software Engineering",
        "location": getattr(internship, "location", "Remote") or "Remote",
        "work_mode": getattr(internship, "work_mode", "Hybrid") or "Hybrid",
        "stipend": getattr(internship, "stipend", "Competitive") or "Competitive",
        "duration": internship.duration or "3-6 months",
        "compatibility_score": overall,
        "skills_match_score": skills_score,
        "domain_match_score": domain_match,
        "matched_skills": list(dict.fromkeys(matched_skills)),
        "missing_skills": list(dict.fromkeys(missing_skills)),
        "required_skills": req_skills_raw,
        "reason": reason
    }


@router.get("/compatibility")
@router.get("/{resume_id}/compatibility")
def get_detailed_compatibility_matches(
    resume_id: Optional[str] = "active",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    seed_internships_if_empty(db)

    # Find target resume
    if resume_id == "active" or resume_id == "0":
        resume = db.query(Resume).filter(
            Resume.owner_id == current_user.id,
            Resume.is_active == True
        ).order_by(Resume.id.desc()).first()

        if not resume:
            resume = db.query(Resume).filter(
                Resume.owner_id == current_user.id
            ).order_by(Resume.id.desc()).first()
    else:
        try:
            r_id = int(resume_id)
            resume = db.query(Resume).filter(
                Resume.id == r_id,
                Resume.owner_id == current_user.id
            ).first()
        except Exception:
            resume = None

    candidate_skills = []
    candidate_text = ""
    active_filename = "Profile Skills"

    if resume:
        candidate_text = resume.extracted_text or ""
        active_filename = getattr(resume, "filename", "Active Resume")
        if resume.parsed_data:
            try:
                p = json.loads(resume.parsed_data)
                candidate_skills = _clean_skills(p.get("skills", {}))
            except Exception:
                pass

        if not candidate_skills:
            analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume.id).first()
            if analysis and analysis.skills:
                candidate_skills = _clean_skills(analysis.skills)

    # Fallback to StudentProfile skills
    if not candidate_skills:
        from app.models.student_profile import StudentProfile
        prof = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if prof and prof.skills:
            candidate_skills = _clean_skills(prof.skills)
            candidate_text = f"{prof.target_role or ''} {prof.bio or ''} {prof.degree or ''}"
            active_filename = "Candidate Profile"

    if not candidate_skills and not resume:
        raise HTTPException(
            status_code=404,
            detail="No resume or profile skills found. Please update your profile or upload a resume."
        )

    internships = db.query(Internship).filter(Internship.status == "active").all()
    results = [
        _calculate_compatibility(candidate_skills, candidate_text, job)
        for job in internships
    ]

    # Sort descending by compatibility_score
    results.sort(key=lambda x: x["compatibility_score"], reverse=True)

    return {
        "resume_id": resume.id if resume else 0,
        "filename": getattr(resume, "filename", active_filename) if resume else active_filename,
        "extracted_skills": candidate_skills[:12],
        "total_matches": len(results),
        "matches": results
    }


# Backwards compatibility endpoints
@router.get("/{resume_id}")
def get_internship_matches(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    compat = get_detailed_compatibility_matches(str(resume_id), current_user, db)
    return {
        "recommendations": [
            {
                "internship_id": m["internship_id"],
                "match_percentage": m["compatibility_score"],
                "reason": m["reason"]
            }
            for m in compat["matches"]
        ]
    }


@router.get("/{resume_id}/rag")
def get_rag_matches(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_internship_matches(resume_id, current_user, db)