from sqlalchemy import Column, Integer, String, Date, ForeignKey

from app.database import Base


class Attendance(Base):
    __tablename__ = "attendance"

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

    date = Column(
        Date,
        nullable=False
    )

    status = Column(
        String,
        default="present",
        nullable=False
    )