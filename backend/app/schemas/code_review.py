from pydantic import BaseModel
from typing import Optional


class CodeReviewCreate(BaseModel):
    submission_id: int


class CodeReviewResponse(BaseModel):
    id: int
    submission_id: int
    score: Optional[int]
    feedback: Optional[str]
    suggestions: Optional[str]

    class Config:
        from_attributes = True