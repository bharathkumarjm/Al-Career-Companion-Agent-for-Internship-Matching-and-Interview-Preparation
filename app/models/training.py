from sqlalchemy import Column, Integer, String, Text, Date, Time

from app.database import Base


class TrainingSession(Base):
    __tablename__ = "training_sessions"

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

    date = Column(
        Date,
        nullable=False
    )

    time = Column(
        Time,
        nullable=True
    )

    trainer = Column(
        String,
        nullable=True
    )

    status = Column(
        String,
        default="scheduled",
        nullable=False
    )