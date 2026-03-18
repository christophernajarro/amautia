"""Test service functions."""
import json
from app.services.ai_service import _mock_response, extract_json


def test_mock_response_correction():
    result = _mock_response("Corrige este examen por favor")
    data = json.loads(result)
    assert "score" in data
    assert "answers" in data
    assert data["score"] == 16
    assert data["total"] == 20


def test_mock_response_generation():
    result = _mock_response("Generar un examen de matemáticas")
    data = json.loads(result)
    assert "questions" in data
    assert len(data["questions"]) == 5


def test_mock_response_tutor():
    result = _mock_response("Tutor, ayúdame con fracciones")
    assert "paso a paso" in result.lower() or "ayudar" in result.lower()


def test_mock_response_default():
    result = _mock_response("algo completamente aleatorio xyz")
    assert "Configure un proveedor" in result


def test_extract_json_direct():
    text = '{"key": "value"}'
    result = extract_json(text)
    assert result == {"key": "value"}


def test_extract_json_from_markdown():
    text = 'Some text\n```json\n{"key": "value"}\n```\nMore text'
    result = extract_json(text)
    assert result == {"key": "value"}


def test_extract_json_embedded():
    text = 'Here is the result: {"score": 15, "total": 20} end.'
    result = extract_json(text)
    assert result["score"] == 15


def test_extract_json_invalid():
    result = extract_json("no json here at all")
    assert result is None
