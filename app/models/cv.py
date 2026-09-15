from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class CV(Base):
    __tablename__ = "cvs"

    id = Column(Integer, primary_key=True, index=True)

    resume_id = Column(
        Integer,
        ForeignKey("resumes.id"),
        nullable=False
    )

    owner_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    file_path = Column(String, nullable=False)

    filename = Column(String, nullable=False)

    resume = relationship("Resume")

    owner = relationship("User")