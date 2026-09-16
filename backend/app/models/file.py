from sqlalchemy import Column, Integer, String, ForeignKey

from app.database import Base


class FileRecord(Base):
    __tablename__ = "files"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    filename = Column(
        String,
        nullable=False
    )

    file_path = Column(
        String,
        nullable=False
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    file_type = Column(
        String,
        nullable=True
    )
    