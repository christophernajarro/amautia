"""Basic health and security tests."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.security import hash_password, verify_password, create_access_token, decode_token


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_endpoint(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "Amautia API"


def test_password_hashing():
    password = "test_password_123"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrong_password", hashed)


def test_jwt_tokens():
    data = {"sub": "test-user-id", "role": "profesor"}
    token = create_access_token(data)
    assert token

    decoded = decode_token(token)
    assert decoded is not None
    assert decoded["sub"] == "test-user-id"
    assert decoded["role"] == "profesor"
    assert decoded["type"] == "access"


def test_invalid_token():
    decoded = decode_token("invalid.token.here")
    assert decoded is None


@pytest.mark.asyncio
async def test_protected_endpoint_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/auth/me")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_admin_endpoint_requires_auth(client: AsyncClient):
    response = await client.get("/api/v1/admin/users")
    assert response.status_code in (401, 403)


@pytest.mark.asyncio
async def test_cors_headers(client: AsyncClient):
    response = await client.options(
        "/health",
        headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "GET"}
    )
    # Should not error
    assert response.status_code in (200, 405)
