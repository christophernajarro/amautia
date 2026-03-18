import asyncio
import logging
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from app.core.database import engine, async_session, Base
from app.core.security import hash_password
from app.models import *

logger = logging.getLogger(__name__)

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # Check if admin exists
        result = await db.execute(select(User).where(User.email == "admin@amautia.com"))
        if result.scalar_one_or_none():
            logger.info("Seed data already exists, skipping.")
            return

        # Create superadmin
        admin = User(
            email="admin@amautia.com",
            password_hash=hash_password("admin123"),
            first_name="Admin",
            last_name="Amautia",
            role="superadmin",
            is_active=True,
            is_verified=True,
        )
        db.add(admin)

        # Create test profesor
        profesor = User(
            email="profesor@amautia.com",
            password_hash=hash_password("profesor123"),
            first_name="Juan",
            last_name="Profesor",
            role="profesor",
            is_active=True,
            is_verified=True,
        )
        db.add(profesor)

        # Create test alumno
        alumno = User(
            email="alumno@amautia.com",
            password_hash=hash_password("alumno123"),
            first_name="María",
            last_name="Alumna",
            role="alumno",
            is_active=True,
            is_verified=True,
        )
        db.add(alumno)

        # Create plans
        plans = [
            Plan(name="Gratis", slug="gratis", description="Plan gratuito con funciones básicas", price_monthly=0, max_corrections_month=5, max_generations_month=2, max_students=20, max_subjects=2, has_tutor=False, tutor_level="none", has_rubrics=False, has_analytics=False, has_whatsapp_notifications=False, is_academy=False, max_professors=1, display_order=1),
            Plan(name="Básico", slug="basico", description="Ideal para profesores independientes", price_monthly=29, max_corrections_month=50, max_generations_month=20, max_students=100, max_subjects=5, has_tutor=True, tutor_level="basic", has_rubrics=False, has_analytics=False, has_whatsapp_notifications=False, is_academy=False, max_professors=1, display_order=2),
            Plan(name="Pro", slug="pro", description="Para profesores profesionales", price_monthly=79, max_corrections_month=300, max_generations_month=None, max_students=500, max_subjects=None, has_tutor=True, tutor_level="full", has_rubrics=True, has_analytics=True, has_whatsapp_notifications=True, is_academy=False, max_professors=1, display_order=3),
            Plan(name="Enterprise", slug="enterprise", description="Para academias y universidades", price_monthly=199, max_corrections_month=None, max_generations_month=None, max_students=None, max_subjects=None, has_tutor=True, tutor_level="full", has_rubrics=True, has_analytics=True, has_whatsapp_notifications=True, is_academy=True, max_professors=None, display_order=4),
        ]
        for plan in plans:
            db.add(plan)

        # System config
        configs = [
            SystemConfig(key="yape_number", value={"number": "999999999"}, description="Número de Yape para pagos"),
            SystemConfig(key="plin_number", value={"number": "888888888"}, description="Número de Plin para pagos"),
            SystemConfig(key="grace_period_days", value={"days": 3}, description="Días de gracia antes de degradar plan"),
            SystemConfig(key="require_registration_approval", value={"enabled": False}, description="Requiere aprobación de admin para registros"),
            SystemConfig(key="default_grading_scale", value={"scale": "0-20"}, description="Escala de calificación por defecto"),
        ]
        for config in configs:
            db.add(config)

        await db.commit()
        logger.info("Seed data created successfully!")
        logger.info("Test users: admin@amautia.com, profesor@amautia.com, alumno@amautia.com")

if __name__ == "__main__":
    asyncio.run(seed())
