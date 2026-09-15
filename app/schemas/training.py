from pydantic import BaseModel
from datetime import date, time as datetime_time
from typing import Optional


class TrainingSessionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    date: date
    time: Optional[datetime_time] = None
    trainer: Optional[str] = None


class TrainingSessionResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    date: date
    time: Optional[datetime_time]
    trainer: Optional[str]
    status: str

    class Config:
        from_attributes = True