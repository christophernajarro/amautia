import uuid
from fastapi import HTTPException


def parse_uuid(value: str, name: str = "ID") -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except (ValueError, AttributeError):
        raise HTTPException(400, f"{name} inválido: {value}")
