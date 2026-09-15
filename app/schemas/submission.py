from pydantic import BaseModel
from typing import Optional


class SubmissionCreate(BaseModel):
    task_id: int
    submission_text: Optional[str] = None


class SubmissionResponse(BaseModel):
    id: int
    task_id: int
    intern_id: int
    submission_text: Optional[str]
    file_path: Optional[str]
    status: str

    class Config:
        from_attributes = True