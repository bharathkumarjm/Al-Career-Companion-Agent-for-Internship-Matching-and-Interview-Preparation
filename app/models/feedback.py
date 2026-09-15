from sqlalchemy import Column, Integer, Text, ForeignKey

from app.database import Base


class MentorFeedback(Base):
    __tablename__ = "mentor_feedback"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    submission_id = Column(
        Integer,
        ForeignKey("submissions.id"),
        nullable=False
    )

    mentor_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    feedback = Column(
        Text,
        nullable=False
    )

    rating = Column(
        Integer,
        nullable=True
    )