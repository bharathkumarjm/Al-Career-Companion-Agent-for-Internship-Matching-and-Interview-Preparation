from pydantic import BaseModel


class ProjectCreate(BaseModel):
    title: str
    description: str | None = None
    mentor_id: int | None = None
    intern_id: int


class ProjectResponse(BaseModel):
    id: int
    title: str
    description: str | None
    mentor_id: int | None
    intern_id: int
    status: str

    class Config:
        from_attributes = True