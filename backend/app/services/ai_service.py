"""AI service: multi-provider support with streaming."""
import json
import re
import httpx
from typing import AsyncIterator
from app.models.ai_provider import AIProvider, AIModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


async def get_ai_config(db: AsyncSession, purpose: str = "correction") -> dict:
    """Get active AI provider config, fallback to mock if none configured."""
    r = await db.execute(select(AIProvider).where(AIProvider.is_active == True))
    provider = r.scalar_one_or_none()
    if not provider:
        return {"provider": "mock", "model": "mock", "api_key": None}
    return {
        "provider": provider.slug,
        "model": provider.model_id,
        "api_key": provider.api_key_encrypted,
        "max_tokens": provider.max_tokens,
    }


async def call_ai(prompt: str, config: dict = None) -> str:
    """Call AI provider synchronously."""
    if not config or config.get("provider") == "mock":
        return _mock_response(prompt)
    return await _call_real_provider(prompt, config)


async def stream_ai(prompt: str, config: dict = None) -> AsyncIterator[str]:
    """Call AI provider with streaming."""
    if not config or config.get("provider") == "mock":
        # Mock streaming
        response = _mock_response(prompt)
        for word in response.split():
            yield word + " "
        return
    async for chunk in _stream_real_provider(prompt, config):
        yield chunk


async def _call_real_provider(prompt: str, config: dict) -> str:
    """Call actual AI provider."""
    provider = config.get("provider", "").lower()
    if provider == "openai":
        return await _call_openai(prompt, config)
    elif provider == "gemini":
        return await _call_gemini(prompt, config)
    elif provider == "anthropic":
        return await _call_anthropic(prompt, config)
    else:
        return _mock_response(prompt)


async def _stream_real_provider(prompt: str, config: dict) -> AsyncIterator[str]:
    """Stream from actual AI provider."""
    provider = config.get("provider", "").lower()
    if provider == "openai":
        async for chunk in _stream_openai(prompt, config):
            yield chunk
    elif provider == "gemini":
        async for chunk in _stream_gemini(prompt, config):
            yield chunk
    else:
        async for chunk in _stream_mock(prompt):
            yield chunk


async def _call_openai(prompt: str, config: dict) -> str:
    """Call OpenAI API."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {config.get('api_key')}"},
            json={
                "model": config.get("model", "gpt-4o"),
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": config.get("max_tokens", 2000),
            },
            timeout=30,
        )
        data = response.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "")


async def _call_gemini(prompt: str, config: dict) -> str:
    """Call Google Gemini API."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{config.get('model')}:generateContent",
            params={"key": config.get("api_key")},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=30,
        )
        data = response.json()
        return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")


async def _call_anthropic(prompt: str, config: dict) -> str:
    """Call Anthropic Claude API."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": config.get("api_key"),
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": config.get("model", "claude-opus-4-6"),
                "max_tokens": config.get("max_tokens", 2000),
                "messages": [{"role": "user", "content": prompt}],
            },
            timeout=30,
        )
        data = response.json()
        return data.get("content", [{}])[0].get("text", "")


async def _stream_openai(prompt: str, config: dict) -> AsyncIterator[str]:
    """Stream from OpenAI."""
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {config.get('api_key')}"},
            json={
                "model": config.get("model", "gpt-4o"),
                "messages": [{"role": "user", "content": prompt}],
                "stream": True,
                "max_tokens": config.get("max_tokens", 2000),
            },
            timeout=30,
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    try:
                        data = json.loads(line[6:])
                        yield data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    except:
                        pass


async def _stream_gemini(prompt: str, config: dict) -> AsyncIterator[str]:
    """Stream from Gemini."""
    async with httpx.AsyncClient() as client:
        async with client.stream(
            "POST",
            f"https://generativelanguage.googleapis.com/v1beta/models/{config.get('model')}:streamGenerateContent",
            params={"key": config.get("api_key")},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=30,
        ) as response:
            async for line in response.aiter_lines():
                try:
                    data = json.loads(line)
                    yield data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                except:
                    pass


async def _stream_mock(prompt: str) -> AsyncIterator[str]:
    """Mock streaming."""
    response = _mock_response(prompt)
    for word in response.split():
        yield word + " "


def _mock_response(prompt: str) -> str:
    """Generate a mock response when no AI provider is configured."""
    p = prompt.lower()
    
    # CORRECTION: Check first since "general" in correction examples triggers "genera" falsely
    if "corrige" in p or ("correc" in p and "generar" not in p and "genera un" not in p):
        return json.dumps({
            "score": 16,
            "total": 20,
            "percentage": 80,
            "feedback": "Buen trabajo en general. Hay algunos errores menores en las preguntas 3 y 5.",
            "answers": [
                {"question": 1, "score": 4, "max": 4, "correct": True, "feedback": "Respuesta correcta y bien fundamentada."},
                {"question": 2, "score": 4, "max": 4, "correct": True, "feedback": "Excelente desarrollo del tema."},
                {"question": 3, "score": 2, "max": 4, "correct": False, "feedback": "Parcialmente correcto. Falta mencionar el concepto X."},
                {"question": 4, "score": 4, "max": 4, "correct": True, "feedback": "Perfecto."},
                {"question": 5, "score": 2, "max": 4, "correct": False, "feedback": "La respuesta es incompleta. Se esperaba incluir Y."},
            ]
        })
    
    # GENERATION: Check for explicit generation keywords
    if "generar un examen" in p or "generate" in p or ("generar" in p and "correc" not in p):
        return json.dumps({
            "title": "Examen generado",
            "questions": [
                {"number": 1, "text": "¿Cuál es la definición de...?", "type": "open", "answer": "La definición es...", "explanation": "Concepto fundamental del tema.", "points": 4},
                {"number": 2, "text": "Explique el proceso de...", "type": "open", "answer": "El proceso consiste en...", "explanation": "Requiere comprensión del procedimiento.", "points": 4},
                {"number": 3, "text": "Compare y contraste...", "type": "open", "answer": "Las similitudes son... Las diferencias son...", "explanation": "Análisis comparativo.", "points": 4},
                {"number": 4, "text": "¿Verdadero o Falso? ...", "type": "true_false", "answer": "Verdadero", "explanation": "Según la teoría estudiada.", "points": 4},
                {"number": 5, "text": "Resuelva el siguiente problema...", "type": "problem", "answer": "La solución es...", "explanation": "Aplicación práctica.", "points": 4},
            ]
        })
    
    # TUTOR/STUDY
    if "tutor" in p or "estudi" in p or "ayudar" in p:
        return "¡Claro! Te puedo ayudar con eso. Vamos paso a paso:\n\n1. Primero, es importante entender el concepto base...\n2. Luego, podemos ver cómo se aplica en la práctica...\n3. Finalmente, hagamos un ejercicio juntos.\n\n¿Por dónde quieres empezar?"
    
    # STUDY PLAN
    if "plan" in p or "estudio" in p:
        return json.dumps({
            "title": "Plan de estudio personalizado",
            "topics": [
                {"name": "Fundamentos", "priority": "high", "exercises": 5, "description": "Revisar conceptos básicos"},
                {"name": "Aplicación", "priority": "medium", "exercises": 3, "description": "Practicar con problemas"},
                {"name": "Análisis", "priority": "low", "exercises": 2, "description": "Desarrollar pensamiento crítico"},
            ]
        })
    
    # DEFAULT
    return "Respuesta generada por el sistema. Configure un proveedor de IA para obtener respuestas reales."


def extract_json(text: str) -> dict | list | None:
    """Try to extract JSON from AI response text."""
    # Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # Try finding JSON in markdown code blocks
    match = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except:
            pass
    # Try finding JSON object
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except:
            pass
    return None
