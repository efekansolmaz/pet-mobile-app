from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import get_settings
from app.core.exceptions import ValidationAppError

ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}


class StorageService:
    def __init__(self) -> None:
        settings = get_settings()
        self.upload_dir = Path(settings.upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        self.max_bytes = settings.max_upload_bytes

    async def save(self, file: UploadFile, folder: str) -> str:
        if file.content_type not in ALLOWED_CONTENT_TYPES:
            raise ValidationAppError("Unsupported file type")
        data = await file.read()
        if len(data) > self.max_bytes:
            raise ValidationAppError("File is too large")
        suffix = Path(file.filename or "upload.bin").suffix or ".bin"
        target_dir = self.upload_dir / folder
        target_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{uuid4()}{suffix}"
        path = target_dir / filename
        path.write_bytes(data)
        return f"/uploads/{folder}/{filename}"
