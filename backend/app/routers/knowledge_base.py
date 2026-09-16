from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.internship import Internship
from app.models.user import User
from app.utils.auth import get_current_user
from app.services.internship_dataset import load_demo_internships, seed_internships_if_empty
from app.services.rag_matcher import InternshipVectorStore
from app.services.groq_service import rag_answer_query

router = APIRouter(
    prefix="/api/knowledge-base",
    tags=["Internship Knowledge Base & RAG"]
)


class RAGQueryRequest(BaseModel):
    query: str
    domain: Optional[str] = None
    top_k: Optional[int] = 4


def _model_to_dict(job: Internship) -> Dict[str, Any]:
    return {
        "id": job.id,
        "title": job.title,
        "company": getattr(job, "company", "TechCorp") or "TechCorp",
        "domain": getattr(job, "domain", "Software Engineering") or "Software Engineering",
        "description": job.description or "",
        "required_skills": job.required_skills or "",
        "preferred_skills": getattr(job, "preferred_skills", "") or "",
        "location": getattr(job, "location", "Remote") or "Remote",
        "work_mode": getattr(job, "work_mode", "Hybrid") or "Hybrid",
        "stipend": getattr(job, "stipend", "Competitive") or "Competitive",
        "duration": job.duration or "3-6 months",
        "education_requirements": getattr(job, "education_requirements", "") or "",
        "experience_requirements": getattr(job, "experience_requirements", "") or "",
        "responsibilities": getattr(job, "responsibilities", "") or "",
        "interview_process": getattr(job, "interview_process", "") or "",
        "status": job.status or "active"
    }


@router.get("/internships")
def get_knowledge_base_internships(
    domain: Optional[str] = None,
    work_mode: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    seed_internships_if_empty(db)

    query = db.query(Internship).filter(Internship.status == "active")

    if domain and domain.lower() != "all":
        query = query.filter(Internship.domain.ilike(f"%{domain}%"))

    if work_mode and work_mode.lower() != "all":
        query = query.filter(Internship.work_mode.ilike(f"%{work_mode}%"))

    internships = query.all()
    results = [_model_to_dict(i) for i in internships]

    if search and search.strip():
        s = search.lower().strip()
        results = [
            r for r in results
            if s in r["title"].lower()
            or s in r["company"].lower()
            or s in r["required_skills"].lower()
            or s in r["description"].lower()
        ]

    return {
        "total": len(results),
        "internships": results
    }


@router.get("/internships/{internship_id}")
def get_internship_detail(
    internship_id: int,
    db: Session = Depends(get_db)
):
    seed_internships_if_empty(db)
    job = db.query(Internship).filter(Internship.id == internship_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Internship not found")
    return _model_to_dict(job)


@router.get("/domains")
def get_domains(db: Session = Depends(get_db)):
    seed_internships_if_empty(db)
    internships = db.query(Internship).filter(Internship.status == "active").all()
    domain_counts = {}
    for i in internships:
        d = getattr(i, "domain", "Software Engineering") or "Software Engineering"
        domain_counts[d] = domain_counts.get(d, 0) + 1

    return [
        {"name": "All Domains", "count": len(internships)},
        *[{"name": d, "count": count} for d, count in sorted(domain_counts.items())]
    ]


@router.post("/rag-query")
def rag_search_knowledge_base(
    payload: RAGQueryRequest,
    db: Session = Depends(get_db)
):
    seed_internships_if_empty(db)
    query_text = payload.query.strip()
    if not query_text:
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    all_jobs = db.query(Internship).filter(Internship.status == "active").all()
    job_records = [_model_to_dict(j) for j in all_jobs]

    if not job_records:
        job_records = load_demo_internships()

    # Perform TF-IDF semantic vector retrieval
    store = InternshipVectorStore(job_records)
    search_results = store.search(query_text, top_k=payload.top_k or 4)

    retrieved = [item["record"] for item in search_results]

    # Synthesize grounded answer with Groq LLM
    rag_result = rag_answer_query(query_text, retrieved)

    # Attach the full internship objects for the recommended IDs
    rec_ids = set(rag_result.get("recommended_internship_ids", []))
    matched_internships = [j for j in retrieved if int(j.get("id", 0)) in rec_ids]
    if not matched_internships:
        matched_internships = retrieved[:3]

    return {
        "query": query_text,
        "answer": rag_result.get("answer", ""),
        "key_takeaways": rag_result.get("key_takeaways", []),
        "retrieved_count": len(matched_internships),
        "internships": matched_internships
    }
