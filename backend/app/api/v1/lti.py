"""LTI 1.3: registration, context mapping, launch, JWKS."""
import json
import uuid
import logging
import base64
import hashlib
import hmac
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.core.dependencies import get_admin, get_current_user
from app.core.utils import parse_uuid
from app.models.user import User
from app.models.lti import LTIRegistration, LTIContext
from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter()
settings = get_settings()


# ─── Request schemas ───

class CreateRegistrationRequest(BaseModel):
    name: str
    client_id: str
    platform_url: str
    auth_url: str
    token_url: str
    jwks_url: str
    deployment_id: str


class UpdateRegistrationRequest(BaseModel):
    name: str | None = None
    client_id: str | None = None
    platform_url: str | None = None
    auth_url: str | None = None
    token_url: str | None = None
    jwks_url: str | None = None
    deployment_id: str | None = None
    is_active: bool | None = None


class CreateContextRequest(BaseModel):
    external_course_id: str
    section_id: str | None = None
    mapping: dict | None = None


class LTILaunchRequest(BaseModel):
    id_token: str


# ─── Helpers ───

def _decode_jwt_unverified(token: str) -> dict | None:
    """Decode JWT payload without cryptographic verification.

    In a production deployment this should be replaced with full
    signature verification against the platform JWKS endpoint.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        # Decode payload (part 1)
        payload_b64 = parts[1]
        # Add padding
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding
        payload_bytes = base64.urlsafe_b64decode(payload_b64)
        return json.loads(payload_bytes)
    except Exception as e:
        logger.warning("JWT decode error: %s", str(e))
        return None


# ─── Registrations ───

@router.post("/registrations")
async def create_registration(
    data: CreateRegistrationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin),
):
    """Register an LTI platform (admin only)."""
    if not data.name.strip():
        raise HTTPException(400, "El nombre es requerido")
    if not data.client_id.strip():
        raise HTTPException(400, "El client_id es requerido")

    # Check for duplicate client_id
    existing = (await db.execute(
        select(LTIRegistration).where(LTIRegistration.client_id == data.client_id)
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(400, "Ya existe un registro con este client_id")

    reg = LTIRegistration(
        name=data.name,
        client_id=data.client_id,
        platform_url=data.platform_url,
        auth_url=data.auth_url,
        token_url=data.token_url,
        jwks_url=data.jwks_url,
        deployment_id=data.deployment_id,
    )
    db.add(reg)
    await db.commit()
    await db.refresh(reg)

    return {
        "id": str(reg.id),
        "name": reg.name,
        "client_id": reg.client_id,
        "platform_url": reg.platform_url,
        "is_active": reg.is_active,
        "created_at": reg.created_at.isoformat(),
    }


@router.get("/registrations")
async def list_registrations(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin),
):
    """List all LTI registrations."""
    regs = (await db.execute(
        select(LTIRegistration).order_by(desc(LTIRegistration.created_at))
    )).scalars().all()

    return [{
        "id": str(r.id),
        "name": r.name,
        "client_id": r.client_id,
        "platform_url": r.platform_url,
        "auth_url": r.auth_url,
        "token_url": r.token_url,
        "jwks_url": r.jwks_url,
        "deployment_id": r.deployment_id,
        "is_active": r.is_active,
        "created_at": r.created_at.isoformat(),
    } for r in regs]


@router.put("/registrations/{reg_id}")
async def update_registration(
    reg_id: str,
    data: UpdateRegistrationRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin),
):
    """Update an LTI registration."""
    rid = parse_uuid(reg_id, "registration_id")
    reg = (await db.execute(
        select(LTIRegistration).where(LTIRegistration.id == rid)
    )).scalar_one_or_none()
    if not reg:
        raise HTTPException(404, "Registro no encontrado")

    if data.name is not None:
        reg.name = data.name
    if data.client_id is not None:
        reg.client_id = data.client_id
    if data.platform_url is not None:
        reg.platform_url = data.platform_url
    if data.auth_url is not None:
        reg.auth_url = data.auth_url
    if data.token_url is not None:
        reg.token_url = data.token_url
    if data.jwks_url is not None:
        reg.jwks_url = data.jwks_url
    if data.deployment_id is not None:
        reg.deployment_id = data.deployment_id
    if data.is_active is not None:
        reg.is_active = data.is_active

    await db.commit()
    return {"ok": True}


@router.delete("/registrations/{reg_id}")
async def delete_registration(
    reg_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin),
):
    """Delete an LTI registration."""
    rid = parse_uuid(reg_id, "registration_id")
    reg = (await db.execute(
        select(LTIRegistration).where(LTIRegistration.id == rid)
    )).scalar_one_or_none()
    if not reg:
        raise HTTPException(404, "Registro no encontrado")

    await db.delete(reg)
    await db.commit()
    return {"ok": True}


# ─── Context mapping ───

@router.post("/registrations/{reg_id}/contexts")
async def create_context(
    reg_id: str,
    data: CreateContextRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin),
):
    """Map an LTI context (external course) to an Amautia section."""
    rid = parse_uuid(reg_id, "registration_id")

    reg = (await db.execute(
        select(LTIRegistration).where(LTIRegistration.id == rid)
    )).scalar_one_or_none()
    if not reg:
        raise HTTPException(404, "Registro no encontrado")

    if not data.external_course_id.strip():
        raise HTTPException(400, "El external_course_id es requerido")

    section_uuid = parse_uuid(data.section_id, "section_id") if data.section_id else None

    # Check for duplicate context mapping
    existing = (await db.execute(
        select(LTIContext).where(
            LTIContext.registration_id == rid,
            LTIContext.external_course_id == data.external_course_id,
        )
    )).scalar_one_or_none()
    if existing:
        raise HTTPException(400, "Ya existe un mapeo para este curso externo")

    ctx = LTIContext(
        registration_id=rid,
        external_course_id=data.external_course_id,
        section_id=section_uuid,
        mapping=data.mapping,
    )
    db.add(ctx)
    await db.commit()
    await db.refresh(ctx)

    return {
        "id": str(ctx.id),
        "registration_id": str(ctx.registration_id),
        "external_course_id": ctx.external_course_id,
        "section_id": str(ctx.section_id) if ctx.section_id else None,
        "mapping": ctx.mapping,
        "created_at": ctx.created_at.isoformat(),
    }


@router.get("/registrations/{reg_id}/contexts")
async def list_contexts(
    reg_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_admin),
):
    """List context mappings for a registration."""
    rid = parse_uuid(reg_id, "registration_id")

    contexts = (await db.execute(
        select(LTIContext)
        .where(LTIContext.registration_id == rid)
        .order_by(LTIContext.created_at)
    )).scalars().all()

    return [{
        "id": str(c.id),
        "registration_id": str(c.registration_id),
        "external_course_id": c.external_course_id,
        "section_id": str(c.section_id) if c.section_id else None,
        "mapping": c.mapping,
        "created_at": c.created_at.isoformat(),
    } for c in contexts]


# ─── LTI Launch ───

@router.post("/launch")
async def lti_launch(
    data: LTILaunchRequest,
    db: AsyncSession = Depends(get_db),
):
    """LTI 1.3 launch endpoint.

    Decodes the id_token JWT, validates the issuer against registered platforms,
    looks up or creates context mappings, and returns session information.

    NOTE: In production, the JWT signature must be verified against the
    platform JWKS. This implementation performs structural validation only.
    """
    payload = _decode_jwt_unverified(data.id_token)
    if not payload:
        raise HTTPException(400, "Token JWT invalido")

    # Extract standard LTI claims
    issuer = payload.get("iss", "")
    client_id = payload.get("aud", "")
    if isinstance(client_id, list):
        client_id = client_id[0] if client_id else ""

    deployment_id = payload.get(
        "https://purl.imsglobal.org/spec/lti/claim/deployment_id", ""
    )

    # Find matching registration
    reg = (await db.execute(
        select(LTIRegistration).where(
            LTIRegistration.platform_url == issuer,
            LTIRegistration.client_id == client_id,
            LTIRegistration.is_active == True,
        )
    )).scalar_one_or_none()
    if not reg:
        raise HTTPException(403, "Plataforma LTI no registrada o inactiva")

    # Extract context (course) info
    context_claim = payload.get(
        "https://purl.imsglobal.org/spec/lti/claim/context", {}
    )
    external_course_id = context_claim.get("id", "")

    # Find or note context mapping
    context_mapping = None
    section_id = None
    if external_course_id:
        context_mapping = (await db.execute(
            select(LTIContext).where(
                LTIContext.registration_id == reg.id,
                LTIContext.external_course_id == external_course_id,
            )
        )).scalar_one_or_none()

        if context_mapping:
            section_id = context_mapping.section_id

    # Extract user info from claims
    sub = payload.get("sub", "")
    email = payload.get("email", "")
    name = payload.get("name", "")
    given_name = payload.get("given_name", "")
    family_name = payload.get("family_name", "")

    # Extract roles
    roles_claim = payload.get(
        "https://purl.imsglobal.org/spec/lti/claim/roles", []
    )
    is_instructor = any(
        "Instructor" in r or "Teacher" in r or "Administrator" in r
        for r in roles_claim
    )

    return {
        "status": "ok",
        "registration_id": str(reg.id),
        "platform_name": reg.name,
        "section_id": str(section_id) if section_id else None,
        "context": {
            "external_course_id": external_course_id,
            "course_title": context_claim.get("title", ""),
            "mapped": context_mapping is not None,
        },
        "user": {
            "sub": sub,
            "email": email,
            "name": name or f"{given_name} {family_name}".strip(),
            "is_instructor": is_instructor,
            "roles": roles_claim,
        },
    }


# ─── JWKS ───

@router.get("/jwks")
async def jwks_endpoint():
    """Public JWKS endpoint for LTI tool registration.

    Returns a minimal JWKS structure. In a production deployment this should
    serve the actual public keys used for signing tool messages.
    """
    # Generate a deterministic key ID from the secret key
    secret = getattr(settings, "SECRET_KEY", "amautia-default-key")
    key_id = hashlib.sha256(secret.encode()).hexdigest()[:16]

    return {
        "keys": [
            {
                "kty": "RSA",
                "kid": key_id,
                "use": "sig",
                "alg": "RS256",
                "n": "",
                "e": "AQAB",
            }
        ]
    }
