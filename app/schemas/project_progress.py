from pydantic import BaseModel


class ProjectProgressCreate(BaseModel):
    project_id: int
    progress_percentage: int = 0


class ProjectProgressUpdate(BaseModel):
    progress_percentage: int


class ProjectProgressResponse(BaseModel):
    id: int
    project_id: int
    intern_id: int
    progress_percentage: int
    status: str

    class Config:
        from_attributes = True