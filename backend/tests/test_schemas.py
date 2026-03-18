"""Test schema validation."""
import pytest
from pydantic import ValidationError
from app.schemas.admin import (
    UserCreateRequest, UserUpdateRequest, PlanCreateRequest, StatusToggle,
)
from app.schemas.auth import RegisterRequest, LoginRequest


def test_user_create_request():
    data = UserCreateRequest(
        email="test@example.com",
        password="test123",
        first_name="Test",
        last_name="User",
        role="profesor",
    )
    assert data.email == "test@example.com"
    assert data.is_active is True  # default


def test_user_update_request_partial():
    data = UserUpdateRequest(first_name="New Name")
    dumped = data.model_dump(exclude_unset=True)
    assert "first_name" in dumped
    assert "last_name" not in dumped
    assert "role" not in dumped


def test_user_update_no_dangerous_fields():
    """Ensure UserUpdateRequest schema doesn't allow password_hash or email."""
    data = UserUpdateRequest.model_validate({"first_name": "Test"})
    dumped = data.model_dump(exclude_unset=True)
    assert "password_hash" not in dumped
    assert "email" not in dumped


def test_plan_create_defaults():
    data = PlanCreateRequest(name="Test", slug="test", price_monthly=29.0)
    assert data.has_tutor is False
    assert data.max_professors == 1
    assert data.display_order == 0


def test_status_toggle():
    data = StatusToggle(is_active=False)
    assert data.is_active is False


def test_register_request():
    data = RegisterRequest(
        email="test@example.com",
        password="pass123",
        first_name="A",
        last_name="B",
        role="alumno",
    )
    assert data.role == "alumno"


def test_login_request():
    data = LoginRequest(email="test@example.com", password="pass123")
    assert data.email == "test@example.com"
