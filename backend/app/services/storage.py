import os
import uuid
from pathlib import Path
from fastapi import UploadFile
from app.config import get_settings

settings = get_settings()


async def save_file(file: UploadFile, subfolder: str = "general") -> str:
    """Save uploaded file to local storage, return relative URL path."""
    upload_dir = Path(settings.UPLOAD_DIR) / subfolder
    upload_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename or "file").suffix
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = upload_dir / filename

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    return f"/uploads/{subfolder}/{filename}"


async def save_files(files: list[UploadFile], subfolder: str = "general") -> list[str]:
    """Save multiple files, return list of URL paths."""
    urls = []
    for file in files:
        url = await save_file(file, subfolder)
        urls.append(url)
    return urls


def delete_file(url: str):
    """Delete a file by its URL path."""
    if url.startswith("/uploads/"):
        filepath = Path(settings.UPLOAD_DIR) / url.replace("/uploads/", "", 1)
        if filepath.exists():
            filepath.unlink()
