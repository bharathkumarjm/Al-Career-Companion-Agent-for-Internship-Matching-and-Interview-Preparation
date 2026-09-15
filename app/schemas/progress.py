from pydantic import BaseModel
from typing import Optional


class ProgressCreate(BaseModel):
    course_name: str
    description: Optional[str] = None
    progress_percentage: int = 0


class ProgressUpdate(BaseModel):
    progress_percentage: int
    status: Optional[str] = None


class ProgressResponse(BaseModel):
    id: int
    intern_id: int
    course_name: str
    description: Optional[str]
    progress_percentage: int
    status: str

    class Config:
        from_attributes = True