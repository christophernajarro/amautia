"""Test configuration and fixtures."""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import engine


@pytest_asyncio.fixture
async def client():
    """Async test client with proper cleanup."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    # Dispose engine pool to avoid event loop issues between tests
    await engine.dispose()
