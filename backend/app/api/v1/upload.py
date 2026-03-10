from fastapi import APIRouter, Depends, UploadFile, File
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.storage import save_file, save_files

router = APIRouter()


@router.post("/upload")
async def upload_single(file: UploadFile = File(...), user: User = Depends(get_current_user)):
    url = await save_file(file, f"user/{str(user.id)}")
    return {"url": url, "filename": file.filename}


@router.post("/upload/batch")
async def upload_batch(files: list[UploadFile] = File(...), user: User = Depends(get_current_user)):
    urls = await save_files(files, f"user/{str(user.id)}")
    return {"urls": urls, "count": len(urls)}
