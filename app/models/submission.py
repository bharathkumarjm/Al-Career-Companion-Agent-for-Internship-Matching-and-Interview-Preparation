from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.database import Base


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)

    task_id = Column(
        Integer,
        ForeignKey("tasks.id"),
        nullable=False
    )

    intern_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    submission_text = Column(Text, nullable=True)

    file_path = Column(String, nullable=True)

    status = Column(
        String,
        default="submitted"
    )