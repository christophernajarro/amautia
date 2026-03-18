import os
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import get_settings

settings = get_settings()


ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".csv", ".txt", ".docx", ".xlsx"}
EXTENSION_CONTENT_TYPE_MAP = {
    ".pdf": {"application/pdf"},
    ".png": {"image/png"},
    ".jpg": {"image/jpeg", "image/jpg"},
    ".jpeg": {"image/jpeg", "image/jpg"},
    ".csv": {"text/csv"},
    ".txt": {"text/plain"},
    ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
    ".xlsx": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"},
}


async def save_file(file: UploadFile, subfolder: str = "general") -> str:
    """Save uploaded file to local storage, return relative URL path."""
    # Validate file size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(413, f"Archivo demasiado grande. Máximo: {settings.MAX_FILE_SIZE // (1024*1024)}MB")

    # Validate content type
    if file.content_type and file.content_type not in settings.ALLOWED_UPLOAD_TYPES:
        raise HTTPException(
            415,
            f"Tipo de archivo no permitido: {file.content_type}. "
            f"Tipos aceptados: PDF, imágenes, CSV, Word, Excel"
        )

    # Sanitize filename: only use the extension from original filename to prevent path traversal
    ext = Path(file.filename or "file").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(415, f"Extensión de archivo no permitida: {ext}")
    # Validate extension matches content_type
    if file.content_type and ext in EXTENSION_CONTENT_TYPE_MAP:
        if file.content_type not in EXTENSION_CONTENT_TYPE_MAP[ext]:
            raise HTTPException(
                415,
                f"La extensión {ext} no coincide con el tipo de contenido {file.content_type}"
            )

    upload_dir = Path(settings.UPLOAD_DIR) / subfolder
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = upload_dir / filename

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
