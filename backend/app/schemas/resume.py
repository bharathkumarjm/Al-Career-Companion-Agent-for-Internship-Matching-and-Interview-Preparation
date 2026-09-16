from pydantic import BaseModel


class ResumeResponse(BaseModel):
    id: int
    filename: str
    owner_id: int
    extracted_text: str
    
    class Config:
        from_attributes = True