from pydantic import BaseModel
from typing import Optional


class InternshipCreate(BaseModel):
    title: str
    description: Optional[str] = None
    required_skills: str
    duration: Optional[str] = None


class InternshipResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    required_skills: str
    duration: Optional[str]
    status: str

    class Config:
        from_attributes = True