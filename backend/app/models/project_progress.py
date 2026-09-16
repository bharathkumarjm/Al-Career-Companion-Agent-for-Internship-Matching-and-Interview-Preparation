from sqlalchemy import Column, Integer, String, ForeignKey

from app.database import Base


class ProjectProgress(Base):
    __tablename__ = "project_progress"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    project_id = Column(
        Integer,
        ForeignKey("projects.id"),
        nullable=False
    )

    intern_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    progress_percentage = Column(
        Integer,
        default=0,
        nullable=False
    )

    status = Column(
        String,
        default="not_started",
        nullable=False
    )