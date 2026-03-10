"""Multi-provider AI service for exam correction, generation, and tutoring."""
import json
import re
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.ai_provider import AIProvider, AIModel
from app.config import get_settings

settings = get_settings()


async def get_ai_config(db: AsyncSession, task: str = "correction") -> dict | None:
    """Get the default AI model config for a task (correction/generation/tutor/vision)."""
    field_map = {
        "correction": "is_default_correction",
        "generation": "is_default_generation",
        "tutor": "is_default_tutor",
        "vision": "is_default_vision",
    }
    field = field_map.get(task)
    if not field:
        return None

    result = await db.execute(
        select(AIModel, AIProvider)
        .join(AIProvider, AIProvider.id == AIModel.provider_id)
        .where(getattr(AIModel, field) == True, AIModel.is_active == True, AIProvider.is_active == True)
        .limit(1)
    )
    row = result.first()
    if not row:
        return None

    model, provider = row
    api_key = provider.api_key_encrypted or ""
    # Fallback to env vars
    if not api_key:
        if provider.slug == "openai":
            api_key = settings.OPENAI_API_KEY
        elif provider.slug in ("google", "gemini"):
            api_key = settings.GOOGLE_API_KEY
        elif provider.slug in ("anthropic", "claude"):
            api_key = settings.ANTHROPIC_API_KEY

    return {
        "provider": provider.slug,
        "model_id": model.model_id,
        "api_key": api_key,
        "max_tokens": model.max_tokens or 4096,
        "supports_vision": model.supports_vision,
    }


async def call_ai(prompt: str, system: str = "", config: dict | None = None,
                   images: list[str] | None = None) -> str:
    """Call AI provider and return text response."""
    if not config or not config.get("api_key"):
        return _mock_response(prompt)

    provider = config["provider"]
    if provider == "openai":
        return await _call_openai(prompt, system, config, images)
    elif provider in ("google", "gemini"):
        return await _call_gemini(prompt, system, config, images)
    elif provider in ("anthropic", "claude"):
        return await _call_anthropic(prompt, system, config, images)
    else:
        return _mock_response(prompt)


async def stream_ai(prompt: str, system: str = "", config: dict | None = None) -> AsyncGenerator[str, None]:
    """Stream AI response token by token."""
    if not config or not config.get("api_key"):
        for word in _mock_response(prompt).split():
            yield word + " "
        return

    provider = config["provider"]
    if provider == "openai":
        async for chunk in _stream_openai(prompt, system, config):
            yield chunk
    elif provider in ("google", "gemini"):
        async for chunk in _stream_gemini(prompt, system, config):
            yield chunk
    elif provider in ("anthropic", "claude"):
        async for chunk in _stream_anthropic(prompt, system, config):
            yield chunk
    else:
        for word in _mock_response(prompt).split():
            yield word + " "


# ─── Provider Implementations ───

async def _call_openai(prompt: str, system: str, config: dict, images: list[str] | None = None) -> str:
    import httpx
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    content = [{"type": "text", "text": prompt}]
    if images:
        for img_url in images:
            content.append({"type": "image_url", "image_url": {"url": img_url}})
    messages.append({"role": "user", "content": content if images else prompt})

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post("https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {config['api_key']}"},
            json={"model": config["model_id"], "messages": messages, "max_tokens": config["max_tokens"]})
        data = resp.json()
        return data["choices"][0]["message"]["content"]


async def _call_gemini(prompt: str, system: str, config: dict, images: list[str] | None = None) -> str:
    import httpx
    full_prompt = f"{system}\n\n{prompt}" if system else prompt
    contents = [{"parts": [{"text": full_prompt}]}]

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{config['model_id']}:generateContent?key={config['api_key']}",
            json={"contents": contents, "generationConfig": {"maxOutputTokens": config["max_tokens"]}})
        data = resp.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]


async def _call_anthropic(prompt: str, system: str, config: dict, images: list[str] | None = None) -> str:
    import httpx
    messages = [{"role": "user", "content": prompt}]
    body = {"model": config["model_id"], "messages": messages, "max_tokens": config["max_tokens"]}
    if system:
        body["system"] = system

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post("https://api.anthropic.com/v1/messages",
            headers={"x-api-key": config["api_key"], "anthropic-version": "2023-06-01", "content-type": "application/json"},
            json=body)
        data = resp.json()
        return data["content"][0]["text"]


async def _stream_openai(prompt: str, system: str, config: dict) -> AsyncGenerator[str, None]:
    import httpx
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {config['api_key']}"},
            json={"model": config["model_id"], "messages": messages, "max_tokens": config["max_tokens"], "stream": True}) as resp:
            async for line in resp.aiter_lines():
                if line.startswith("data: ") and line != "data: [DONE]":
                    data = json.loads(line[6:])
                    delta = data["choices"][0].get("delta", {}).get("content", "")
                    if delta:
                        yield delta


async def _stream_gemini(prompt: str, system: str, config: dict) -> AsyncGenerator[str, None]:
    # Gemini streaming via REST
    result = await _call_gemini(prompt, system, config)
    for word in result.split():
        yield word + " "


async def _stream_anthropic(prompt: str, system: str, config: dict) -> AsyncGenerator[str, None]:
    import httpx
    messages = [{"role": "user", "content": prompt}]
    body = {"model": config["model_id"], "messages": messages, "max_tokens": config["max_tokens"], "stream": True}
    if system:
        body["system"] = system

    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream("POST", "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": config["api_key"], "anthropic-version": "2023-06-01", "content-type": "application/json"},
            json=body) as resp:
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    data = json.loads(line[6:])
                    if data.get("type") == "content_block_delta":
                        yield data["delta"].get("text", "")


# ─── Mock for development ───

def _mock_response(prompt: str) -> str:
    """Generate a mock response when no AI provider is configured."""
    # Check generation FIRST (before correction, since generation prompts contain "correcta")
    if "genera" in prompt.lower() or "generate" in prompt.lower():
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
    elif "corregir" in prompt.lower() or "corrige" in prompt.lower() or "correc" in prompt.lower():
        return json.dumps({
            "score": 16,
            "total": 20,
            "percentage": 80,
            "feedback": "Buen trabajo en general. Hay algunos errores menores en las preguntas 3 y 5.",
            "answers": [
                {"question": 1, "score": 4, "max": 4, "correct": True, "feedback": "Respuesta correcta y bien fundamentada."},
                {"question": 2, "score": 4, "max": 4, "correct": True, "feedback": "Excelente desarrollo del tema."},
                {"question": 3, "score": 2, "max": 4, "correct": False, "feedback": "Parcialmente correcto. Falta mencionar el concepto de X."},
                {"question": 4, "score": 4, "max": 4, "correct": True, "feedback": "Perfecto."},
                {"question": 5, "score": 2, "max": 4, "correct": False, "feedback": "La respuesta es incompleta. Se esperaba incluir Y."},
            ]
        })
    elif "tutor" in prompt.lower() or "estudi" in prompt.lower():
        return "¡Claro! Te puedo ayudar con eso. Vamos paso a paso:\n\n1. Primero, es importante entender el concepto base...\n2. Luego, podemos ver cómo se aplica en la práctica...\n3. Finalmente, hagamos un ejercicio juntos.\n\n¿Por dónde quieres empezar?"
    elif "plan" in prompt.lower():
        return json.dumps({
            "title": "Plan de estudio personalizado",
            "topics": [
                {"name": "Fundamentos", "priority": "high", "exercises": 5, "description": "Revisar conceptos básicos"},
                {"name": "Aplicación", "priority": "medium", "exercises": 3, "description": "Practicar con problemas"},
                {"name": "Análisis", "priority": "low", "exercises": 2, "description": "Desarrollar pensamiento crítico"},
            ]
        })
    else:
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
        except json.JSONDecodeError:
            pass
    # Try finding { or [ blocks
    for char, end in [('{', '}'), ('[', ']')]:
        start = text.find(char)
        if start != -1:
            depth = 0
            for i, c in enumerate(text[start:], start):
                if c == char:
                    depth += 1
                elif c == end:
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(text[start:i+1])
                        except json.JSONDecodeError:
                            break
    return None
