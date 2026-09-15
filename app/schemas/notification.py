from pydantic import BaseModel
from typing import Optional


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: Optional[str] = "general"


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    notification_type: str
    is_read: int

    class Config:
        from_attributes = True
