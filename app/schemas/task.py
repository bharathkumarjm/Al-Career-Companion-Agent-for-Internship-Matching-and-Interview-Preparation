from pydantic import BaseModel
from typing import Optional


# ==========================================
# CREATE TASK
# ==========================================

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: int
    intern_id: int


# ==========================================
# UPDATE TASK
# ==========================================

class TaskUpdate(BaseModel):
    status: str


# ==========================================
# TASK RESPONSE
# ==========================================

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    project_id: int
    intern_id: int

    class Config:
        from_attributes = True