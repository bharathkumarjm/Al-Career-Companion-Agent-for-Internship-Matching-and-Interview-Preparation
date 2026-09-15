from sqlalchemy import Column, Integer, String, Text, ForeignKey

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    title = Column(
        String,
        nullable=False
    )

    message = Column(
        Text,
        nullable=False
    )

    notification_type = Column(
        String,
        default="general",
        nullable=False
    )

    is_read = Column(
        Integer,
        default=0,
        nullable=False
    )