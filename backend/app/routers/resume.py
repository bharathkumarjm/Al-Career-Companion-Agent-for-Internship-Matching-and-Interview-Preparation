import os
import json
from datetime import datetime
from typing import Any, Dict, List, Optional
from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.resume import Resume
from app.models.analysis import ResumeAnalysis
from app.models.student_profile import StudentProfile
from app.models.user import User

from app.schemas.resume import ResumeResponse
from app.schemas.analysis import ResumeAnalysisResponse

from app.utils.auth import get_current_user
from app.services.resume_parser import extract_resume_text
from app.services.groq_service import analyze_resume, deep_extract_resume


router = APIRouter(
    prefix="/resumes",
    tags=["Resumes & Parsing"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


class UpdateExtractionSchema(BaseModel):
    personal_info: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    skills: Optional[Dict[str, Any]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    education: Optional[List[Dict[str, Any]]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    certifications: Optional[List[str]] = None
    career_recommendation: Optional[str] = None


# ============================================================
# UPLOAD RESUME (WITH AUTOMATIC DEEP EXTRACTION)
# ============================================================

@router.post("/upload")
def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allowed_extensions = [".pdf", ".docx"]
    file_extension = os.path.splitext(file.filename)[1].lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Only PDF and DOCX files are allowed"
        )

    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    safe_name = os.path.basename(file.filename)
    filename = f"{current_user.id}_{timestamp}_{safe_name}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not save resume file: {str(e)}"
        )

    try:
        extracted_text = extract_resume_text(file_path, file_extension)
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=400,
            detail=f"Could not extract text: {str(e)}"
        )

    if not extracted_text or not extracted_text.strip():
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=400,
            detail="Could not extract any readable text from the resume"
        )

    # Automatically run deep extraction
    deep_extracted = deep_extract_resume(extracted_text)

    # Mark previous resumes as not active
    db.query(Resume).filter(Resume.owner_id == current_user.id).update({"is_active": False})

    # Save new resume
    resume = Resume(
        filename=file.filename,
        file_path=file_path,
        extracted_text=extracted_text,
        parsed_data=json.dumps(deep_extracted),
        is_active=True,
        uploaded_at=datetime.utcnow(),
        owner_id=current_user.id
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    # Save to ResumeAnalysis for backward compatibility
    try:
        all_skills = (
            deep_extracted.get("skills", {}).get("technical_skills", []) +
            deep_extracted.get("skills", {}).get("tools_frameworks", [])
        )
        analysis = ResumeAnalysis(
            resume_id=resume.id,
            summary=deep_extracted.get("summary", ""),
            skills=json.dumps(all_skills),
            education=json.dumps([f"{e.get('degree', '')} at {e.get('institution', '')}" for e in deep_extracted.get("education", [])]),
            experience=json.dumps([f"{exp.get('role', '')} at {exp.get('company', '')}" for exp in deep_extracted.get("experience", [])]),
            projects=json.dumps([p.get("title", "") for p in deep_extracted.get("projects", [])]),
            certifications=json.dumps(deep_extracted.get("certifications", [])),
            career_recommendation=deep_extracted.get("career_recommendation", "")
        )
        db.add(analysis)
        db.commit()
    except Exception as err:
        print("Analysis sync error:", err)

    # Also update StudentProfile skills and details if empty
    try:
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        if profile:
            if all_skills:
                profile.skills = json.dumps(all_skills)
            p_info = deep_extracted.get("personal_info", {})
            if p_info.get("phone") and not profile.phone:
                profile.phone = p_info["phone"]
            if p_info.get("linkedin") and not profile.linkedin_url:
                profile.linkedin_url = p_info["linkedin"]
            if p_info.get("github") and not profile.github_url:
                profile.github_url = p_info["github"]
            db.commit()
    except Exception as err:
        print("Profile sync error:", err)

    return {
        "id": resume.id,
        "filename": resume.filename,
        "extracted_text": resume.extracted_text,
        "parsed_data": deep_extracted,
        "is_active": True,
        "message": "Resume uploaded and parsed successfully!"
    }


# ============================================================
# LIST USER RESUMES
# ============================================================

@router.get("/my")
def get_my_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resumes = db.query(Resume).filter(
        Resume.owner_id == current_user.id
    ).order_by(Resume.id.desc()).all()

    return [
        {
            "id": r.id,
            "filename": r.filename,
            "is_active": bool(r.is_active),
            "uploaded_at": r.uploaded_at.strftime("%b %d, %Y %H:%M") if r.uploaded_at else "Recently",
            "has_parsed_data": bool(r.parsed_data),
            "preview_snippet": (r.extracted_text[:250] + "...") if r.extracted_text else ""
        }
        for r in resumes
    ]


# ============================================================
# SET ACTIVE RESUME
# ============================================================

@router.post("/{resume_id}/set-active")
def set_active_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.owner_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    db.query(Resume).filter(Resume.owner_id == current_user.id).update({"is_active": False})
    resume.is_active = True
    db.commit()

    return {"message": f"Resume '{resume.filename}' set as active for matching."}


# ============================================================
# DOWNLOAD RESUME
# ============================================================

@router.get("/{resume_id}/download")
def download_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.owner_id == current_user.id
    ).first()
    if not resume or not resume.file_path or not os.path.exists(resume.file_path):
        raise HTTPException(status_code=404, detail="Resume file not found on server")

    return FileResponse(
        path=resume.file_path,
        filename=resume.filename,
        media_type="application/octet-stream"
    )


# ============================================================
# DELETE RESUME
# ============================================================

@router.delete("/{resume_id}")
def delete_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.owner_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.file_path and os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except Exception:
            pass

    # Also clean up analyses
    db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume.id).delete()
    db.delete(resume)
    db.commit()

    return {"message": "Resume deleted successfully"}


# ============================================================
# DEEP EXTRACTION (VIEW & VERIFY SKILLS / EXPERIENCE)
# ============================================================

@router.get("/{resume_id}/deep-extract")
def get_deep_extraction(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.owner_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    extracted = None
    if resume.parsed_data:
        try:
            extracted = json.loads(resume.parsed_data)
        except Exception:
            extracted = None

    if not extracted:
        # Extract if not yet parsed
        extracted = deep_extract_resume(resume.extracted_text or "")
        resume.parsed_data = json.dumps(extracted)
        db.commit()

    # Sync with student profile so LinkedIn / GitHub are never missing
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile:
        p_info = extracted.get("personal_info") or {}
        changed = False
        if not p_info.get("linkedin") and profile.linkedin_url:
            p_info["linkedin"] = profile.linkedin_url
            changed = True
        if not p_info.get("github") and profile.github_url:
            p_info["github"] = profile.github_url
            changed = True
        if changed:
            extracted["personal_info"] = p_info
            resume.parsed_data = json.dumps(extracted)
            db.commit()

    return {
        "resume_id": resume.id,
        "filename": resume.filename,
        "is_active": bool(resume.is_active),
        "uploaded_at": resume.uploaded_at.strftime("%b %d, %Y %H:%M") if resume.uploaded_at else "Recently",
        "raw_text": resume.extracted_text or "",
        "data": extracted
    }


@router.post("/{resume_id}/re-extract")
def re_extract_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.owner_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    extracted = deep_extract_resume(resume.extracted_text or "")
    resume.parsed_data = json.dumps(extracted)
    db.commit()

    return {
        "message": "Resume successfully re-extracted with AI!",
        "resume_id": resume.id,
        "filename": resume.filename,
        "is_active": bool(resume.is_active),
        "uploaded_at": resume.uploaded_at.strftime("%b %d, %Y %H:%M") if resume.uploaded_at else "Recently",
        "raw_text": resume.extracted_text or "",
        "data": extracted
    }


@router.post("/seed-demo")
def seed_demo_resume(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    demo_data = {
        "personal_info": {
            "name": current_user.name or "Alex Student",
            "email": current_user.email,
            "phone": "+1 (555) 382-9410",
            "location": "San Francisco, CA (Open to Remote)",
            "linkedin": "https://linkedin.com/in/alex-student-ai",
            "github": "https://github.com/alexstudent-dev",
            "portfolio": "https://alexstudent.dev"
        },
        "summary": "Motivated Full-Stack Software Engineer and AI Enthusiast with a solid foundation in Python, React, and FastAPI. Passionate about building robust web services, implementing intelligent NLP & RAG architectures, and optimizing distributed database systems. Proven ability to architect high-performance solutions with clean, test-driven code and agile collaboration.",
        "skills": {
            "technical_skills": [
                "Python", "JavaScript", "TypeScript", "SQL", "HTML5", "CSS3",
                "FastAPI", "React", "Node.js", "Django", "PostgreSQL", "SQLite"
            ],
            "tools_frameworks": [
                "Docker", "Git & GitHub", "Tailwind CSS", "Redux", "Linux",
                "Postman", "Vite", "PyTest", "REST APIs", "Vector DBs"
            ],
            "soft_skills": [
                "Analytical Problem Solving", "Cross-functional Teamwork",
                "Technical Communication", "Agile & Scrum", "Quick Learner"
            ]
        },
        "experience": [
            {
                "role": "Software Engineering Intern",
                "company": "CloudSprint Technologies",
                "duration": "Jun 2024 - Dec 2024",
                "location": "San Francisco, CA (Hybrid)",
                "bullets": [
                    "Engineered and deployed 14+ RESTful API endpoints using FastAPI and PostgreSQL, serving 12,000+ daily active users.",
                    "Optimized database queries and added Redis caching, slashing P99 API response times by 42%.",
                    "Integrated automated CI/CD pipelines with GitHub Actions, reducing staging deployment cycle from 25 minutes to 4 minutes."
                ]
            },
            {
                "role": "Undergraduate Research Assistant - AI & NLP",
                "company": "Kishkinda University AI Lab",
                "duration": "Jan 2024 - May 2024",
                "location": "Ballari, India",
                "bullets": [
                    "Implemented semantic search and RAG knowledge retrieval across 50,000+ academic papers using vector embeddings.",
                    "Improved entity recognition accuracy by 18% through fine-tuned prompt engineering and sentence transformers."
                ]
            }
        ],
        "education": [
            {
                "institution": "Kishkinda University",
                "degree": "Bachelor of Technology in Computer Science & Engineering",
                "year": "2021 - 2025",
                "score": "GPA: 3.85 / 4.0 (Top 5% of class)"
            }
        ],
        "projects": [
            {
                "title": "TalentSprint AI - Smart Career Platform",
                "tech_stack": ["React", "FastAPI", "Groq AI", "SQLite", "NLP"],
                "description": "Comprehensive career acceleration platform featuring AI resume parsing, ATS scoring, multi-factor job compatibility matching, and conversational voice mentor.",
                "link": "https://github.com/alexstudent-dev/talentsprint-ai"
            },
            {
                "title": "Distributed Task Queue & Cache",
                "tech_stack": ["Python", "Redis", "Docker", "AsyncIO"],
                "description": "High-throughput asynchronous background job worker system capable of executing 5,000+ jobs/sec with exponential backoff and dead-letter queues.",
                "link": "https://github.com/alexstudent-dev/async-task-engine"
            }
        ],
        "certifications": [
            "AWS Certified Cloud Practitioner (CLF-C02)",
            "Meta Front-End Developer Professional Certificate",
            "DeepLearning.AI: Prompt Engineering & LLM Application Development"
        ],
        "career_recommendation": "Full Stack Software Engineer, Backend Developer (Python/FastAPI), AI/ML Application Engineer"
    }

    raw_text = f"""{demo_data['personal_info']['name']}
{demo_data['personal_info']['email']} | {demo_data['personal_info']['phone']} | {demo_data['personal_info']['location']}
LinkedIn: {demo_data['personal_info']['linkedin']} | GitHub: {demo_data['personal_info']['github']}

SUMMARY
{demo_data['summary']}

TECHNICAL SKILLS
Languages & Frameworks: {', '.join(demo_data['skills']['technical_skills'])}
Tools: {', '.join(demo_data['skills']['tools_frameworks'])}
Soft Skills: {', '.join(demo_data['skills']['soft_skills'])}

EXPERIENCE
{demo_data['experience'][0]['role']} - {demo_data['experience'][0]['company']} ({demo_data['experience'][0]['duration']})
• {demo_data['experience'][0]['bullets'][0]}
• {demo_data['experience'][0]['bullets'][1]}
• {demo_data['experience'][0]['bullets'][2]}

EDUCATION
{demo_data['education'][0]['degree']}
{demo_data['education'][0]['institution']} ({demo_data['education'][0]['year']}) - {demo_data['education'][0]['score']}

PROJECTS
{demo_data['projects'][0]['title']} ({', '.join(demo_data['projects'][0]['tech_stack'])})
{demo_data['projects'][0]['description']}

CERTIFICATIONS
""" + "\n".join(["• " + c for c in demo_data["certifications"]])

    # Mark existing resumes inactive
    db.query(Resume).filter(Resume.owner_id == current_user.id).update({"is_active": False})

    resume = Resume(
        filename="Alex_Student_Demo_Resume.pdf",
        file_path="",
        extracted_text=raw_text,
        parsed_data=json.dumps(demo_data),
        is_active=True,
        uploaded_at=datetime.utcnow(),
        owner_id=current_user.id
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return {
        "message": "Demo sample resume successfully loaded & parsed! 🎉",
        "resume_id": resume.id,
        "filename": resume.filename,
        "is_active": True,
        "uploaded_at": resume.uploaded_at.strftime("%b %d, %Y %H:%M"),
        "raw_text": raw_text,
        "data": demo_data
    }


@router.put("/{resume_id}/deep-extract")
def update_deep_extraction(
    resume_id: int,
    updated_payload: UpdateExtractionSchema,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.owner_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    current_data = {}
    if resume.parsed_data:
        try:
            current_data = json.loads(resume.parsed_data)
        except Exception:
            pass

    # Merge updates
    dict_updates = updated_payload.dict(exclude_unset=True)
    for k, v in dict_updates.items():
        if v is not None:
            current_data[k] = v

    resume.parsed_data = json.dumps(current_data)
    db.commit()

    # Also sync verified skills and contact info to student profile
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    if profile:
        tech_skills = current_data.get("skills", {}).get("technical_skills", [])
        if tech_skills:
            profile.skills = json.dumps(tech_skills)
        p_info = current_data.get("personal_info") or {}
        if p_info.get("linkedin"):
            profile.linkedin_url = p_info["linkedin"]
        if p_info.get("github"):
            profile.github_url = p_info["github"]
        if p_info.get("phone"):
            profile.phone = p_info["phone"]
        if p_info.get("location"):
            profile.location = p_info["location"]
        db.commit()

    return {
        "message": "Extracted resume details updated and verified successfully!",
        "data": current_data
    }


# Backwards compatibility endpoints
@router.get("/{resume_id}/analyze", response_model=ResumeAnalysisResponse)
def analyze_uploaded_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resume = db.query(Resume).filter(
        Resume.id == resume_id,
        Resume.owner_id == current_user.id
    ).first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    analysis = db.query(ResumeAnalysis).filter(ResumeAnalysis.resume_id == resume.id).first()
    if not analysis:
        result = analyze_resume(resume.extracted_text or "")
        analysis = ResumeAnalysis(
            resume_id=resume.id,
            summary=result.get("summary", ""),
            skills=json.dumps(result.get("skills", [])),
            education=json.dumps(result.get("education", [])),
            experience=json.dumps(result.get("experience", [])),
            projects=json.dumps(result.get("projects", [])),
            certifications=json.dumps(result.get("certifications", [])),
            career_recommendation=result.get("career_recommendation", "")
        )
        db.add(analysis)
        db.commit()
        db.refresh(analysis)

    return {
        "id": analysis.id,
        "resume_id": analysis.resume_id,
        "summary": analysis.summary,
        "skills": json.loads(analysis.skills) if isinstance(analysis.skills, str) else analysis.skills,
        "education": json.loads(analysis.education) if isinstance(analysis.education, str) else analysis.education,
        "experience": json.loads(analysis.experience) if isinstance(analysis.experience, str) else analysis.experience,
        "projects": json.loads(analysis.projects) if isinstance(analysis.projects, str) else analysis.projects,
        "certifications": json.loads(analysis.certifications) if isinstance(analysis.certifications, str) else analysis.certifications,
        "career_recommendation": analysis.career_recommendation or ""
    }


@router.get("/{resume_id}/analysis", response_model=ResumeAnalysisResponse)
def get_resume_analysis(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return analyze_uploaded_resume(resume_id, current_user, db)