from pydantic import BaseModel
from typing import Optional


class FileResponse(BaseModel):
    id: int
    filename: str
    file_path: str
    user_id: int
    file_type: Optional[str]

    class Config:
        from_attributes = True