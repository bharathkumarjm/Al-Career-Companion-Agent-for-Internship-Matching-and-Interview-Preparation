from fastapi.responses import Response
from datetime import datetime
import re
from app.services.export_service import (
    generate_conversation_docx,
    generate_conversation_pdf,
    generate_conversation_markdown,
    generate_conversation_text
)
import io
import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
import pypdf
import docx

from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.student_profile import StudentProfile
from app.models.application import Application
from app.utils.auth import get_current_user
from app.services.groq_service import (
    chat_career_assistant,
    generate_role_recommendations,
    generate_interview_prep_pack,
    generate_document_qa
)
from app.services.nlp_service import analyze_user_query, analyze_document_nlp, run_nlp_workbench

router = APIRouter(
    prefix="/api/assistant",
    tags=["AI Career Companion Agent for Internship Matching and Interview Preparation"]
)


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    attached_filename: Optional[str] = None


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    attached_doc: Optional[str] = None
    attached_filename: Optional[str] = None
    mode: Optional[str] = "minimal"  # "minimal" (default) or "detailed"



class DocAnalyzeRequest(BaseModel):
    text: str


class WorkbenchRequest(BaseModel):
    text: str



class ConversationExportRequest(BaseModel):
    messages: List[Dict[str, Any]]
    format: str = "pdf"  # "pdf", "docx", "md", "txt"
    target_role: Optional[str] = None

class RoleRecommendationRequest(BaseModel):
    preferred_domain: Optional[str] = None


class InterviewPrepRequest(BaseModel):
    role: str
    focus_area: Optional[str] = None


class DocumentQARequest(BaseModel):
    text: str
    filename: Optional[str] = "document.pdf"
    num_questions: Optional[int] = 6


def _get_active_resume_data(user_id: int, db: Session) -> Dict[str, Any]:
    """Helper to retrieve candidate's active parsed resume data."""
    active_resume = db.query(Resume).filter(
        Resume.owner_id == user_id,
        Resume.is_active == True
    ).first()

    if not active_resume:
        active_resume = db.query(Resume).filter(
            Resume.owner_id == user_id
        ).order_by(Resume.id.desc()).first()

    if not active_resume:
        return {}

    parsed = {}
    if active_resume.parsed_data:
        try:
            parsed = json.loads(active_resume.parsed_data)
        except Exception:
            parsed = {}

    parsed["filename"] = active_resume.filename
    parsed["id"] = active_resume.id
    if not parsed.get("summary") and active_resume.extracted_text:
        parsed["extracted_text_preview"] = active_resume.extracted_text[:1200]
    return parsed


@router.post("/analyze-doc-nlp")
def analyze_document_nlp_endpoint(payload: DocAnalyzeRequest):
    """Direct NLP diagnostics endpoint for resumes and job documents."""
    return analyze_document_nlp(payload.text)


@router.post("/nlp-workbench")
def nlp_workbench_endpoint(payload: WorkbenchRequest):
    """Interactive NLP Workbench endpoint returning keyphrases, entity spans, verb impact, and ATS diagnostics."""
    return run_nlp_workbench(payload.text)


@router.post("/upload-doc")
async def upload_document_for_assistant(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a document (PDF, DOCX, TXT, MD) to provide direct context to the Career Assistant."""
    filename = file.filename or "document.txt"
    ext = filename.split(".")[-1].lower() if "." in filename else "txt"
    content = await file.read()
    extracted_text = ""

    if ext == "pdf":
        try:
            reader = pypdf.PdfReader(io.BytesIO(content))
            extracted_text = "\n".join([page.extract_text() or "" for page in reader.pages])
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read PDF file: {str(e)}")
    elif ext in ["docx", "doc"]:
        try:
            doc = docx.Document(io.BytesIO(content))
            extracted_text = "\n".join([p.text for p in doc.paragraphs if p.text])
        except Exception:
            extracted_text = content.decode("utf-8", errors="ignore")
    else:
        extracted_text = content.decode("utf-8", errors="ignore")

    if not extracted_text.strip():
        raise HTTPException(status_code=400, detail="The uploaded document appears to be empty or unreadable.")

    clean_text = extracted_text.strip()
    if len(clean_text) > 12000:
        clean_text = clean_text[:12000] + "\n...[Document Truncated for AI context window]"

    # Run instant NLP document diagnostics
    doc_nlp = analyze_document_nlp(clean_text)

    return {
        "filename": filename,
        "file_size": len(content),
        "extracted_text": clean_text,
        "preview": clean_text[:350] + ("..." if len(clean_text) > 350 else ""),
        "nlp_diagnostics": doc_nlp
    }


@router.post("/chat")
def chat_with_career_assistant(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Chat with the AI Career Companion Agent grounded in candidate's extracted resume data."""
    if not payload.messages:
        raise HTTPException(status_code=400, detail="Messages array cannot be empty")

    # 1. NLP Query Analysis on user's latest prompt
    user_msgs = [m for m in payload.messages if m.role == "user"]
    last_user_prompt = user_msgs[-1].content if user_msgs else ""
    nlp_insights = analyze_user_query(last_user_prompt) if last_user_prompt else {}

    # 2. Document NLP Diagnostics if file attached
    if payload.attached_doc and payload.attached_doc.strip():
        doc_nlp = analyze_document_nlp(payload.attached_doc)
        nlp_insights["document_diagnostics"] = doc_nlp

    # 3. Assemble student profile & EXTRACTED RESUME context
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    app_count = db.query(Application).filter(Application.user_id == current_user.id).count()
    resume_data = _get_active_resume_data(current_user.id, db)

    skills_list = []
    if profile and profile.skills:
        try:
            skills_list = json.loads(profile.skills)
        except Exception:
            skills_list = [profile.skills]

    student_context = {
        "name": current_user.name,
        "target_role": profile.target_role if profile else "Software Engineer Intern",
        "university": profile.university if profile else "Engineering University",
        "skills": skills_list,
        "application_count": app_count,
        "nlp_insights": nlp_insights,
        "resume_data": resume_data,
        "active_resume_filename": resume_data.get("filename", ""),
        "mode": payload.mode or "minimal"
    }

    if payload.attached_doc and payload.attached_doc.strip():
        student_context["attached_document"] = f"FILE: {payload.attached_filename or 'attached_document'}\n{payload.attached_doc.strip()}"

    raw_msgs = [{"role": m.role, "content": m.content} for m in payload.messages]
    ai_response = chat_career_assistant(raw_msgs, student_context)

    suggested_actions = nlp_insights.get("follow_ups") or [
        "Which role can I apply for?",
        "Which internship is suitable for my skills?",
        "What are my strongest technical skills?",
        f"Prepare me for {profile.target_role if profile and profile.target_role else 'Software Engineering'} interviews",
        "Generate 5 technical questions with answer guidance"
    ]

    return {
        "response": ai_response,
        "nlp_insights": nlp_insights,
        "suggested_actions": suggested_actions,
        "resume_grounded": bool(resume_data)
    }


@router.post("/role-recommendations")
def get_role_recommendations(
    payload: Optional[RoleRecommendationRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze candidate's extracted resume data to recommend top suitable roles and internships."""
    resume_data = _get_active_resume_data(current_user.id, db)
    if not resume_data:
        # Fallback using student profile
        profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
        skills = []
        if profile and profile.skills:
            try:
                skills = json.loads(profile.skills)
            except Exception:
                skills = [profile.skills]
        resume_data = {
            "personal_info": {"name": current_user.name},
            "skills": {"technical_skills": skills or ["Python", "FastAPI", "React", "SQL"]},
            "projects": [{"title": "Cloud Application", "tech_stack": ["Python", "React"]}],
            "target_role": profile.target_role if profile else "Software Engineer Intern"
        }

    recommendations = generate_role_recommendations(resume_data)
    return recommendations


@router.post("/generate-interview-prep")
def get_interview_prep_pack(
    payload: InterviewPrepRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate role-specific technical questions, HR questions, answer guidance, and preparation roadmap."""
    if not payload.role or not payload.role.strip():
        raise HTTPException(status_code=400, detail="Target role is required for interview preparation")

    resume_data = _get_active_resume_data(current_user.id, db)
    prep_pack = generate_interview_prep_pack(payload.role.strip(), resume_data)
    return prep_pack


@router.post("/generate-doc-qa")
def generate_doc_qa_endpoint(
    payload: DocumentQARequest,
    current_user: User = Depends(get_current_user),
):
    """Generate relevant Questions & Answers based on uploaded PDF/DOCX document content."""
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Document text content cannot be empty")

    qa_pack = generate_document_qa(
        payload.text,
        payload.filename or "document.pdf",
        payload.num_questions or 6
    )
    return qa_pack


@router.post("/export-conversation")
def export_conversation_endpoint(
    payload: ConversationExportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export conversation to PDF, Word (DOCX), Markdown, or Plain Text."""
    if not payload.messages:
        raise HTTPException(status_code=400, detail="No conversation messages to export.")

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.id).first()
    candidate_name = current_user.name or "Candidate"
    target_role = payload.target_role or (profile.target_role if profile and profile.target_role else "Software Engineer Intern")
    fmt = payload.format.lower().strip()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', candidate_name)

    if fmt == "docx":
        buf = generate_conversation_docx(payload.messages, candidate_name, target_role)
        filename = f"Career_Conversation_{safe_name}_{timestamp}.docx"
        return Response(
            content=buf.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    elif fmt == "pdf":
        buf = generate_conversation_pdf(payload.messages, candidate_name, target_role)
        filename = f"Career_Conversation_{safe_name}_{timestamp}.pdf"
        return Response(
            content=buf.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    elif fmt == "md":
        md_content = generate_conversation_markdown(payload.messages, candidate_name, target_role)
        filename = f"Career_Conversation_{safe_name}_{timestamp}.md"
        return Response(
            content=md_content.encode("utf-8"),
            media_type="text/markdown",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
    else:  # txt
        txt_content = generate_conversation_text(payload.messages, candidate_name, target_role)
        filename = f"Career_Conversation_{safe_name}_{timestamp}.txt"
        return Response(
            content=txt_content.encode("utf-8"),
            media_type="text/plain",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Access-Control-Expose-Headers": "Content-Disposition"
            }
        )
