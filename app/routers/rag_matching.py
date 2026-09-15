from fastapi import APIRouter, HTTPException

from app.services.internship_agent import GroundedInternshipAgent
from app.services.internship_dataset import load_demo_internships
from app.services.rag_matcher import InternshipMatchAgent

router = APIRouter(
    prefix="/matching",
    tags=["RAG Internship Matching"],
)


@router.post("/rag/query")
def query_rag_internships(payload: dict):
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload must be a JSON object.")

    candidate = payload.get("candidate") or payload.get("resume_data") or payload
    internships = payload.get("internships")
    top_k = int(payload.get("top_k", 5))

    if not isinstance(candidate, dict):
        raise HTTPException(status_code=400, detail="Candidate profile must be a valid object.")

    agent = InternshipMatchAgent(internships or load_demo_internships())
    return agent.query(candidate, top_k=top_k)


@router.post("/rag/agent")
def query_grounded_internship_agent(payload: dict):
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload must be a JSON object.")

    candidate = payload.get("candidate") or payload.get("resume_data") or payload
    internships = payload.get("internships")
    top_k = int(payload.get("top_k", 5))

    if not isinstance(candidate, dict):
        raise HTTPException(status_code=400, detail="Candidate profile must be a valid object.")

    agent = GroundedInternshipAgent(internships or load_demo_internships())
    return agent.answer(candidate, top_k=top_k)


@router.get("/rag/demo")
def get_demo_internships():
    return {"internships": load_demo_internships()}
