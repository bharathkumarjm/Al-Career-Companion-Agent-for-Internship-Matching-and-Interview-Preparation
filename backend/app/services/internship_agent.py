from typing import Any, Dict, List, Optional

from app.services.internship_dataset import load_demo_internships
from app.services.rag_matcher import RAGInternshipMatcher


class GroundedInternshipAgent:
    """Grounded AI agent for internship matching.

    It never invents internship attributes: all output is derived from the supplied
    candidate profile and the internship dataset used for retrieval.
    """

    def __init__(self, internship_records: Optional[List[Dict[str, Any]]] = None):
        self.internships = internship_records or load_demo_internships()
        self.matcher = RAGInternshipMatcher(self.internships)

    def answer(self, candidate: Dict[str, Any], top_k: int = 5) -> Dict[str, Any]:
        if not isinstance(candidate, dict):
            raise ValueError("Candidate profile must be a dictionary.")

        result = self.matcher.match_candidate(candidate, self.internships, top_k=top_k)

        grounded_matches = []
        for item in result["recommendations"]:
            internship = next(
                (job for job in self.internships if int(job.get("id")) == int(item["internship_id"])),
                None,
            )

            if not internship:
                continue

            grounded_matches.append({
                "internship_id": int(item["internship_id"]),
                "title": internship.get("title"),
                "company": internship.get("company"),
                "match_percentage": int(item["match_percentage"]),
                "reason": item["reason"],
                "required_skills": internship.get("required_skills"),
                "location": internship.get("location"),
                "work_mode": internship.get("work_mode"),
                "duration": internship.get("duration"),
                "score": item.get("score"),
            })

        return {
            "agent": "Grounded Internship Matching Agent",
            "query_summary": str(candidate.get("summary") or "Candidate profile"),
            "source_constraints": [
                "Use only the candidate resume data provided in the query.",
                "Use only the internship records available in the dataset.",
                "Do not invent internship details, titles, companies, or skills.",
            ],
            "top_matches": grounded_matches,
        }
