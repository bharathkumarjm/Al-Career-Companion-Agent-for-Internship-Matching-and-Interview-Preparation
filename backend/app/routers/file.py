import os

from fastapi import (
    APIRouter,
    Depends,
    UploadFile,
    File,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db
from app.models.file import FileRecord
from app.models.user import User

from app.schemas.file import FileResponse

from app.utils.auth import get_current_user


router = APIRouter(
    prefix="/files",
    tags=["File Management"]
)


UPLOAD_DIR = "uploads/files"

os.makedirs(UPLOAD_DIR, exist_ok=True)


# ==========================================
# UPLOAD FILE
# ==========================================

@router.post(
    "/upload",
    response_model=FileResponse
)
def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File name is missing"
        )

    filename = f"{current_user.id}_{file.filename}"

    file_path = os.path.join(
        UPLOAD_DIR,
        filename
    )

    try:

        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Could not save file: {str(e)}"
        )

    file_record = FileRecord(
        filename=file.filename,
        file_path=file_path,
        user_id=current_user.id,
        file_type=file.content_type
    )

    db.add(file_record)
    db.commit()
    db.refresh(file_record)

    return file_record


# ==========================================
# GET MY FILES
# ==========================================

@router.get(
    "/",
    response_model=list[FileResponse]
)
def get_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    return db.query(FileRecord).filter(
        FileRecord.user_id == current_user.id
    ).all()


# ==========================================
# GET SINGLE FILE
# ==========================================

@router.get(
    "/{file_id}",
    response_model=FileResponse
)
def get_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    file_record = db.query(FileRecord).filter(
        FileRecord.id == file_id,
        FileRecord.user_id == current_user.id
    ).first()

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return file_record