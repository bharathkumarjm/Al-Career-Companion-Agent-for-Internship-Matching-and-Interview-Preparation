import json
import re
from typing import Any, Dict, Iterable, List, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.services.internship_dataset import load_demo_internships


class InternshipVectorStore:
    """Lightweight vector store built on TF-IDF and cosine similarity."""

    def __init__(self, internship_records: Optional[List[Dict[str, Any]]] = None):
        self.records = internship_records or load_demo_internships()
        self.documents = [self._serialize_record(record) for record in self.records]
        self.vectorizer = TfidfVectorizer(
            stop_words="english",
            ngram_range=(1, 2),
            lowercase=True,
            strip_accents="unicode",
        )
        self.matrix = self.vectorizer.fit_transform(self.documents)

    @staticmethod
    def _serialize_record(record: Dict[str, Any]) -> str:
        fields = [
            record.get("title", ""),
            record.get("company", ""),
            record.get("description", ""),
            record.get("required_skills", ""),
            record.get("preferred_skills", ""),
            record.get("education_requirements", ""),
            record.get("experience_requirements", ""),
            record.get("location", ""),
            record.get("work_mode", ""),
            record.get("duration", ""),
        ]
        return " ".join(str(value) for value in fields if value)

    def search(self, query_text: str, top_k: int = 5):
        query_vector = self.vectorizer.transform([query_text])
        similarities = cosine_similarity(query_vector, self.matrix)[0]

        ranked_indexes = sorted(
            enumerate(similarities),
            key=lambda item: item[1],
            reverse=True,
        )[:top_k]

        results = []
        for idx, score in ranked_indexes:
            record = self.records[idx]
            results.append({
                "internship_id": int(record.get("id", idx)),
                "score": float(score),
                "record": record,
            })
        return results


class InternshipMatchAgent:
    """Query interface for internship retrieval using the RAG-inspired vector flow."""

    def __init__(self, internship_records: Optional[List[Dict[str, Any]]] = None):
        self.store = InternshipVectorStore(internship_records)

    def query(self, candidate_data: Dict[str, Any], top_k: int = 5):
        matcher = RAGInternshipMatcher(self.store.records)
        return matcher.match_candidate(candidate_data, self.store.records, top_k=top_k)


class RAGInternshipMatcher:
    def __init__(self, internship_records: Optional[List[Dict[str, Any]]] = None):
        self.store = InternshipVectorStore(internship_records or load_demo_internships())

    @staticmethod
    def _clean_list(value: Any) -> List[str]:
        if value is None:
            return []
        if isinstance(value, list):
            items = value
        elif isinstance(value, str):
            if not value.strip():
                return []
            try:
                parsed = json.loads(value)
                if isinstance(parsed, list):
                    items = parsed
                else:
                    items = [parsed]
            except (TypeError, ValueError):
                items = [value]
        else:
            items = [str(value)]

        cleaned = []
        for item in items:
            if not item:
                continue
            if isinstance(item, str):
                text = item.strip()
                if text:
                    cleaned.extend([part.strip() for part in re.split(r"[,;|]|\n+", text) if part.strip()])
            else:
                cleaned.append(str(item))
        return cleaned

    @staticmethod
    def _normalize_token(token: str) -> str:
        cleaned = re.sub(r"[^a-z0-9]+", " ", str(token).lower())
        return " ".join(cleaned.split())

    @staticmethod
    def _token_set(text_list: List[str]) -> set:
        token_set = set()
        for item in text_list:
            for token in RAGInternshipMatcher._normalize_token(item).split():
                if token and len(token) > 2:
                    token_set.add(token)
        return token_set

    @staticmethod
    def _prepare_candidate_text(candidate: Dict[str, Any]) -> str:
        summary = str(candidate.get("summary") or "")
        skills = RAGInternshipMatcher._clean_list(candidate.get("skills"))
        education = RAGInternshipMatcher._clean_list(candidate.get("education"))
        experience = RAGInternshipMatcher._clean_list(candidate.get("experience"))
        projects = RAGInternshipMatcher._clean_list(candidate.get("projects"))
        certifications = RAGInternshipMatcher._clean_list(candidate.get("certifications"))
        career = str(candidate.get("career_recommendation") or "")

        parts = [
            summary,
            " ".join(skills),
            " ".join(education),
            " ".join(experience),
            " ".join(projects),
            " ".join(certifications),
            career,
        ]
        return " ".join(part for part in parts if part).strip()

    @staticmethod
    def _skill_overlap_weight(candidate: Dict[str, Any], internship: Dict[str, Any]) -> float:
        candidate_skills = RAGInternshipMatcher._token_set(RAGInternshipMatcher._clean_list(candidate.get("skills", [])))
        internship_skills = RAGInternshipMatcher._token_set(
            [
                internship.get("required_skills", ""),
                internship.get("preferred_skills", ""),
                internship.get("title", ""),
            ]
        )

        if not candidate_skills or not internship_skills:
            return 0.0

        overlap = candidate_skills & internship_skills
        if not overlap:
            return 0.0

        return min(1.0, len(overlap) / max(1, len(internship_skills)))

    @staticmethod
    def _title_alignment(candidate: Dict[str, Any], internship: Dict[str, Any]) -> float:
        candidate_text = " ".join([
            str(candidate.get("summary") or ""),
            str(candidate.get("career_recommendation") or ""),
            " ".join(RAGInternshipMatcher._clean_list(candidate.get("skills", []))),
        ]).lower()
        internship_title = str(internship.get("title") or "").lower()

        if not candidate_text or not internship_title:
            return 0.0

        candidate_tokens = set(RAGInternshipMatcher._normalize_token(candidate_text).split())
        title_tokens = set(RAGInternshipMatcher._normalize_token(internship_title).split())
        if not title_tokens:
            return 0.0

        overlap = candidate_tokens & title_tokens
        return min(1.0, len(overlap) / max(1, len(title_tokens)))

    @staticmethod
    def _build_reason(candidate: Dict[str, Any], internship: Dict[str, Any]):
        candidate_skills = {item.lower() for item in RAGInternshipMatcher._clean_list(candidate.get("skills", []))}
        internship_skills = {
            item.strip().lower()
            for item in re.split(r"[,;|/]+", str(internship.get("required_skills", "")))
            if item.strip()
        }
        overlap = sorted(candidate_skills & internship_skills)

        if overlap:
            shared = ", ".join(overlap[:3])
            return (
                f"Strong semantic match because the candidate profile aligns with the internship requirements, "
                f"especially in {shared}."
            )

        candidate_summary = str(candidate.get("summary") or "")
        if candidate_summary and internship.get("title"):
            return (
                f"The candidate profile is relevant to the {internship.get('title', 'internship')} role, "
                f"with strong alignment to the stated project and career direction."
            )

        return "Relevant internship match based on the candidate's overall profile and intent."

    def match_candidate(
        self,
        candidate: Dict[str, Any],
        internships: Optional[List[Dict[str, Any]]] = None,
        top_k: int = 5,
    ) -> Dict[str, Any]:
        if not isinstance(candidate, dict):
            raise ValueError("Candidate must be a dictionary-like profile.")

        candidate_text = self._prepare_candidate_text(candidate)
        if not candidate_text.strip():
            raise ValueError("Candidate profile is empty; provide summary, skills, or experience details.")

        records = internships or self.store.records
        store = InternshipVectorStore(records)
        ranked = store.search(candidate_text, top_k=top_k)

        recommendations = []
        for item in ranked:
            internship = item["record"]
            semantic_similarity = max(0.0, min(1.0, float(item["score"])))
            skill_overlap = self._skill_overlap_weight(candidate, internship)
            title_alignment = self._title_alignment(candidate, internship)

            exact_overlap_bonus = 0.0
            candidate_skills = {self._normalize_token(skill) for skill in self._clean_list(candidate.get("skills", [])) if self._normalize_token(skill)}
            internship_skills = {
                self._normalize_token(skill)
                for skill in re.split(r"[,;|/]+", str(internship.get("required_skills", "")))
                if self._normalize_token(skill)
            }
            exact_overlap = candidate_skills & internship_skills
            if exact_overlap:
                exact_overlap_bonus = min(0.30, len(exact_overlap) * 0.10)

            weighted_score = (0.45 * skill_overlap) + (0.25 * semantic_similarity) + (0.15 * title_alignment) + (0.15 * exact_overlap_bonus / 0.30)
            match_percent = min(100.0, max(0.0, (0.40 + weighted_score) * 100.0))

            recommendation = {
                "internship_id": int(internship.get("id", item["internship_id"])),
                "match_percentage": int(round(match_percent)),
                "reason": self._build_reason(candidate, internship),
                "title": internship.get("title"),
                "company": internship.get("company"),
                "score": round(float(match_percent / 100.0), 4),
            }
            recommendations.append(recommendation)

        return {
            "candidate_summary": str(candidate.get("summary") or ""),
            "recommendations": recommendations,
        }


def match_resume_against_internships(candidate_profile: Dict[str, Any], internships: Optional[List[Dict[str, Any]]] = None, top_k: int = 5):
    return RAGInternshipMatcher(internships or load_demo_internships()).match_candidate(candidate_profile, internships or load_demo_internships(), top_k=top_k)
