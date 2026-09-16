from sqlalchemy import Column, Integer, Text, ForeignKey

from app.database import Base


class CodeReview(Base):
    __tablename__ = "code_reviews"

    id = Column(Integer, primary_key=True, index=True)

    submission_id = Column(
        Integer,
        ForeignKey("submissions.id"),
        nullable=False
    )

    score = Column(Integer, nullable=True)

    feedback = Column(Text, nullable=True)

    suggestions = Column(Text, nullable=True)