from pydantic import BaseModel
from datetime import date


class AttendanceCreate(BaseModel):
    intern_id: int
    date: date
    status: str


class AttendanceResponse(BaseModel):
    id: int
    intern_id: int
    date: date
    status: str

    class Config:
        from_attributes = True