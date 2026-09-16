from pydantic import BaseModel
from typing import List


class ResumeAnalysisResponse(BaseModel):
    id: int
    resume_id: int
    summary: str
    skills: List[str]
    education: List[str]
    experience: List[str]
    projects: List[str]
    certifications: List[str]
    career_recommendation: str

    class Config:
        from_attributes = True