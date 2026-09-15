from pydantic import BaseModel
from typing import Optional


class FeedbackCreate(BaseModel):

    submission_id: int

    feedback: str

    rating: Optional[int] = None


class FeedbackResponse(BaseModel):

    id: int

    submission_id: int

    mentor_id: int

    feedback: str

    rating: Optional[int]

    class Config:
        from_attributes = True