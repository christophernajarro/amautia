"""Test API endpoints."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def test_health(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


async def test_login_invalid_credentials(client: AsyncClient):
    r = await client.post("/api/v1/auth/login", json={"email": "no@exists.com", "password": "wrong"})
    assert r.status_code == 401


async def test_register_missing_fields(client: AsyncClient):
    r = await client.post("/api/v1/auth/register", json={"email": "test@test.com"})
    assert r.status_code == 422


async def test_protected_endpoint_no_token(client: AsyncClient):
    r = await client.get("/api/v1/auth/me")
    assert r.status_code in (401, 403)


async def test_profesor_dashboard_no_token(client: AsyncClient):
    r = await client.get("/api/v1/profesor/dashboard")
    assert r.status_code in (401, 403)


async def test_admin_stats_no_token(client: AsyncClient):
    r = await client.get("/api/v1/admin/dashboard/stats")
    assert r.status_code in (401, 403)


async def test_alumno_dashboard_no_token(client: AsyncClient):
    r = await client.get("/api/v1/alumno/dashboard")
    assert r.status_code in (401, 403)


async def test_public_plans(client: AsyncClient):
    r = await client.get("/api/v1/payments/plans")
    assert r.status_code == 200


async def test_forgot_password_always_ok(client: AsyncClient):
    """Forgot password should always return success (security)."""
    r = await client.post("/api/v1/auth/forgot-password", json={"email": "nonexistent@test.com"})
    assert r.status_code == 200
    assert r.json()["ok"] is True


async def test_reset_password_invalid_token(client: AsyncClient):
    r = await client.post("/api/v1/auth/reset-password", json={"token": "invalid", "new_password": "newpass123"})
    assert r.status_code == 400


async def test_change_password_no_auth(client: AsyncClient):
    r = await client.put("/api/v1/auth/change-password",
                         params={"current_password": "old", "new_password": "new123"})
    assert r.status_code in (401, 403)


async def test_rate_limit_headers(client: AsyncClient):
    """Verify rate limiter doesn't block normal requests."""
    for _ in range(5):
        r = await client.get("/health")
        assert r.status_code == 200
