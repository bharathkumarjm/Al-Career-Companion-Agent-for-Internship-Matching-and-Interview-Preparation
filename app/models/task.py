from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)

    description = Column(Text, nullable=True)

    status = Column(
        String,
        default="pending",
        nullable=False
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

    project = relationship("Project")

    intern = relationship("User")