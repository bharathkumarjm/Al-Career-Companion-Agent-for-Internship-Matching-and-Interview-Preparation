from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=True)
    extracted_text = Column(Text, nullable=True)
    parsed_data = Column(Text, nullable=True)  # JSON string of structured extraction
    is_active = Column(Boolean, default=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    owner = relationship("User")