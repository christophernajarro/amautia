"""Certificates: templates, issuance, verification."""
import secrets
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_profesor
from app.core.utils import parse_uuid
from app.models.user import User
from app.models.certificate import CertificateTemplate, Certificate

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Request schemas ───

class CreateTemplateRequest(BaseModel):
    name: str
    description: str | None = None
    html_template: str
    css_styles: str | None = None
    variables: dict | None = None


class UpdateTemplateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    html_template: str | None = None
    css_styles: str | None = None
    variables: dict | None = None
    is_active: bool | None = None


class IssueCertificateRequest(BaseModel):
    template_id: str
    user_id: str
    title: str
    data: dict | None = None


class BulkIssueCertificateRequest(BaseModel):
    template_id: str
    user_ids: list[str]
    title: str
    data: dict | None = None


# ─── Templates ───

@router.post("/templates")
async def create_template(
    data: CreateTemplateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Create a certificate template."""
    if not data.name.strip():
        raise HTTPException(400, "El nombre es requerido")
    if not data.html_template.strip():
        raise HTTPException(400, "El template HTML es requerido")

    template = CertificateTemplate(
        name=data.name,
        description=data.description,
        html_template=data.html_template,
        css_styles=data.css_styles,
        variables=data.variables,
        created_by=user.id,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)

    return {
        "id": str(template.id),
        "name": template.name,
        "description": template.description,
        "is_active": template.is_active,
        "created_at": template.created_at.isoformat(),
    }


@router.get("/templates")
async def list_templates(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """List certificate templates."""
    templates = (await db.execute(
        select(CertificateTemplate)
        .where(CertificateTemplate.is_active == True)
        .order_by(desc(CertificateTemplate.created_at))
    )).scalars().all()

    return [{
        "id": str(t.id),
        "name": t.name,
        "description": t.description,
        "variables": t.variables,
        "is_active": t.is_active,
        "created_at": t.created_at.isoformat(),
    } for t in templates]


@router.put("/templates/{template_id}")
async def update_template(
    template_id: str,
    data: UpdateTemplateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Update a certificate template."""
    tid = parse_uuid(template_id, "template_id")
    template = (await db.execute(
        select(CertificateTemplate).where(CertificateTemplate.id == tid)
    )).scalar_one_or_none()
    if not template:
        raise HTTPException(404, "Template no encontrado")

    if data.name is not None:
        template.name = data.name
    if data.description is not None:
        template.description = data.description
    if data.html_template is not None:
        template.html_template = data.html_template
    if data.css_styles is not None:
        template.css_styles = data.css_styles
    if data.variables is not None:
        template.variables = data.variables
    if data.is_active is not None:
        template.is_active = data.is_active

    await db.commit()
    return {"ok": True}


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Delete a certificate template."""
    tid = parse_uuid(template_id, "template_id")
    template = (await db.execute(
        select(CertificateTemplate).where(CertificateTemplate.id == tid)
    )).scalar_one_or_none()
    if not template:
        raise HTTPException(404, "Template no encontrado")

    await db.delete(template)
    await db.commit()
    return {"ok": True}


# ─── Issuance ───

@router.post("/issue")
async def issue_certificate(
    data: IssueCertificateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Issue a certificate to a single user."""
    template_id = parse_uuid(data.template_id, "template_id")
    user_id = parse_uuid(data.user_id, "user_id")

    # Verify template exists
    template = (await db.execute(
        select(CertificateTemplate).where(
            CertificateTemplate.id == template_id,
            CertificateTemplate.is_active == True,
        )
    )).scalar_one_or_none()
    if not template:
        raise HTTPException(404, "Template no encontrado o inactivo")

    # Verify recipient exists
    recipient = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not recipient:
        raise HTTPException(404, "Usuario no encontrado")

    verification_code = secrets.token_urlsafe(16)

    cert = Certificate(
        template_id=template_id,
        user_id=user_id,
        title=data.title,
        data=data.data,
        verification_code=verification_code,
    )
    db.add(cert)
    await db.commit()
    await db.refresh(cert)

    return {
        "id": str(cert.id),
        "user_id": str(cert.user_id),
        "title": cert.title,
        "verification_code": cert.verification_code,
        "issued_at": cert.issued_at.isoformat(),
    }


@router.post("/bulk-issue")
async def bulk_issue_certificates(
    data: BulkIssueCertificateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_profesor),
):
    """Issue certificates to multiple users."""
    template_id = parse_uuid(data.template_id, "template_id")

    if not data.user_ids:
        raise HTTPException(400, "Se requiere al menos un usuario")

    # Verify template exists
    template = (await db.execute(
        select(CertificateTemplate).where(
            CertificateTemplate.id == template_id,
            CertificateTemplate.is_active == True,
        )
    )).scalar_one_or_none()
    if not template:
        raise HTTPException(404, "Template no encontrado o inactivo")

    # Validate all user IDs
    user_uuids = [parse_uuid(uid, "user_id") for uid in data.user_ids]
    existing_users = (await db.execute(
        select(User.id).where(User.id.in_(user_uuids))
    )).scalars().all()
    existing_set = set(existing_users)

    certificates = []
    for uid in user_uuids:
        if uid not in existing_set:
            continue

        verification_code = secrets.token_urlsafe(16)
        cert = Certificate(
            template_id=template_id,
            user_id=uid,
            title=data.title,
            data=data.data,
            verification_code=verification_code,
        )
        db.add(cert)
        certificates.append(cert)

    await db.commit()

    # Refresh to get timestamps
    results = []
    for cert in certificates:
        await db.refresh(cert)
        results.append({
            "id": str(cert.id),
            "user_id": str(cert.user_id),
            "title": cert.title,
            "verification_code": cert.verification_code,
            "issued_at": cert.issued_at.isoformat(),
        })

    return results


# ─── My certificates ───

@router.get("/my")
async def my_certificates(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List current user's certificates."""
    certs = (await db.execute(
        select(Certificate, CertificateTemplate.name)
        .join(CertificateTemplate, CertificateTemplate.id == Certificate.template_id)
        .where(Certificate.user_id == user.id)
        .order_by(desc(Certificate.issued_at))
    )).all()

    return [{
        "id": str(c.id),
        "title": c.title,
        "template_name": tname,
        "verification_code": c.verification_code,
        "data": c.data,
        "pdf_url": c.pdf_url,
        "issued_at": c.issued_at.isoformat(),
    } for c, tname in certs]


# ─── Public verification ───

@router.get("/verify/{code}")
async def verify_certificate(
    code: str,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint to verify a certificate. No auth required."""
    cert = (await db.execute(
        select(Certificate).where(Certificate.verification_code == code)
    )).scalar_one_or_none()
    if not cert:
        raise HTTPException(404, "Certificado no encontrado")

    # Get recipient name
    recipient = (await db.execute(select(User).where(User.id == cert.user_id))).scalar_one_or_none()

    # Get template name
    template = (await db.execute(
        select(CertificateTemplate).where(CertificateTemplate.id == cert.template_id)
    )).scalar_one_or_none()

    return {
        "valid": True,
        "title": cert.title,
        "recipient_name": f"{recipient.first_name} {recipient.last_name}" if recipient else "Desconocido",
        "template_name": template.name if template else None,
        "data": cert.data,
        "issued_at": cert.issued_at.isoformat(),
        "verification_code": cert.verification_code,
    }
