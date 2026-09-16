from sqlalchemy import Column, Integer, String, Text, ForeignKey

from app.database import Base


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    intern_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    course_name = Column(
        String,
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
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