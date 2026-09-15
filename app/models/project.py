from sqlalchemy import Column, Integer, String, Text

from app.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    title = Column(
        String,
        nullable=False
    )

    description = Column(
        Text,
        nullable=True
    )

    mentor_id = Column(
        Integer,
        nullable=True
    )

    intern_id = Column(
        Integer,
        nullable=False
    )

    status = Column(
        String,
        default="pending"
    )