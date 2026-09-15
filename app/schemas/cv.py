from pydantic import BaseModel


class CVResponse(BaseModel):
    id: int
    resume_id: int
    owner_id: int
    filename: str
    file_path: str

    class Config:
        from_attributes = True