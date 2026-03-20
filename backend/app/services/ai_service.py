"""AI service: multi-provider support with streaming."""
import json
import re
import time
import logging
import base64
import mimetypes
from pathlib import Path
import httpx
from typing import AsyncIterator
from app.models.ai_provider import AIProvider, AIModel
from app.core.crypto import decrypt_value
from app.config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = logging.getLogger(__name__)
_settings = get_settings()

AI_TIMEOUT = 60  # seconds for non-streaming
AI_STREAM_TIMEOUT = 120  # seconds for streaming
AI_MAX_RETRIES = 2  # retry transient failures

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"}
TEXT_EXTENSIONS = {".txt", ".csv", ".md"}


def _is_image(file_path: str) -> bool:
    """Check if a file path refers to an image based on extension."""
    ext = Path(file_path).suffix.lower()
    return ext in IMAGE_EXTENSIONS


def _get_mime_type(file_path: str) -> str:
    """Infer MIME type from file path."""
    mime, _ = mimetypes.guess_type(file_path)
    return mime or "application/octet-stream"


async def read_file_content(file_url: str) -> dict:
    """Read file content from a local path or URL.

    Returns a dict with:
      - "type": "text" | "image"
      - "content": extracted text (str) or base64-encoded bytes (str)
      - "mime_type": MIME type string (for images)
    """
    raw_bytes: bytes | None = None
    resolved_path: str = file_url

    # --- Resolve to bytes ---
    upload_dir = Path(_settings.UPLOAD_DIR).resolve()

    if file_url.startswith("/uploads/"):
        # Local file stored under UPLOAD_DIR
        local_path = (Path(_settings.UPLOAD_DIR) / file_url.replace("/uploads/", "", 1)).resolve()
        # Path traversal protection: ensure resolved path is within upload directory
        if not str(local_path).startswith(str(upload_dir)):
            logger.warning("read_file_content: path traversal attempt blocked: %s", file_url)
            return {"type": "text", "content": "[Acceso denegado: ruta no permitida]"}
        if not local_path.exists():
            logger.warning("read_file_content: local file not found: %s", local_path)
            return {"type": "text", "content": f"[Archivo no encontrado: {file_url}]"}
        raw_bytes = local_path.read_bytes()
        resolved_path = str(local_path)
    elif file_url.startswith(("http://", "https://")):
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(file_url)
                resp.raise_for_status()
                raw_bytes = resp.content
        except Exception as e:
            logger.error("read_file_content: failed to fetch URL %s: %s", file_url, e)
            return {"type": "text", "content": f"[Error al descargar archivo: {file_url}]"}
    else:
        # Treat as an absolute or relative local path - restrict to uploads directory
        local_path = Path(file_url).resolve()
        if not str(local_path).startswith(str(upload_dir)):
            logger.warning("read_file_content: access denied for path outside uploads: %s", file_url)
            return {"type": "text", "content": "[Acceso denegado: solo se permiten archivos en el directorio de uploads]"}
        if not local_path.exists():
            logger.warning("read_file_content: file not found: %s", file_url)
            return {"type": "text", "content": f"[Archivo no encontrado: {file_url}]"}
        raw_bytes = local_path.read_bytes()

    if raw_bytes is None:
        return {"type": "text", "content": "[No se pudo leer el archivo]"}

    # --- Extract content based on file type ---
    ext = Path(resolved_path or file_url).suffix.lower()

    if ext in IMAGE_EXTENSIONS:
        encoded = base64.b64encode(raw_bytes).decode("utf-8")
        return {"type": "image", "content": encoded, "mime_type": _get_mime_type(resolved_path)}

    if ext == ".pdf":
        text = _extract_pdf_text(raw_bytes)
        return {"type": "text", "content": text}

    # .txt, .csv, .md, and other text-like files
    if ext in TEXT_EXTENSIONS or ext in (".html", ".htm", ".xml", ".json"):
        try:
            return {"type": "text", "content": raw_bytes.decode("utf-8")}
        except UnicodeDecodeError:
            return {"type": "text", "content": raw_bytes.decode("latin-1")}

    # .docx — attempt basic extraction
    if ext == ".docx":
        text = _extract_docx_text(raw_bytes)
        return {"type": "text", "content": text}

    # Fallback: try to decode as text
    try:
        return {"type": "text", "content": raw_bytes.decode("utf-8")}
    except UnicodeDecodeError:
        encoded = base64.b64encode(raw_bytes).decode("utf-8")
        return {"type": "image", "content": encoded, "mime_type": _get_mime_type(resolved_path)}


def _extract_pdf_text(data: bytes) -> str:
    """Extract text from PDF bytes. Uses PyPDF2 if available, else basic fallback."""
    try:
        import io
        from PyPDF2 import PdfReader
        reader = PdfReader(io.BytesIO(data))
        pages = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)
        if pages:
            return "\n\n".join(pages)
    except ImportError:
        logger.info("PyPDF2 not installed — attempting basic PDF text extraction")
    except Exception as e:
        logger.warning("PyPDF2 extraction failed: %s", e)

    # Basic fallback: extract readable strings from PDF binary
    try:
        import io
        text_chunks = []
        raw = data.decode("latin-1")
        # Find text between BT/ET (text object operators) — very rough
        for match in re.finditer(r'\(([^)]+)\)', raw):
            chunk = match.group(1)
            if len(chunk) > 2 and any(c.isalpha() for c in chunk):
                text_chunks.append(chunk)
        if text_chunks:
            return " ".join(text_chunks)
    except Exception:
        pass

    return "[No se pudo extraer texto del PDF. El archivo puede contener solo imágenes.]"


def _extract_docx_text(data: bytes) -> str:
    """Extract text from DOCX bytes using zipfile + XML parsing."""
    try:
        import io
        import zipfile
        import xml.etree.ElementTree as ET

        with zipfile.ZipFile(io.BytesIO(data)) as z:
            if "word/document.xml" not in z.namelist():
                return "[Archivo DOCX inválido]"
            xml_content = z.read("word/document.xml")
            tree = ET.fromstring(xml_content)
            ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
            paragraphs = []
            for p in tree.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
                texts = [t.text for t in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t") if t.text]
                if texts:
                    paragraphs.append("".join(texts))
            return "\n".join(paragraphs) if paragraphs else "[DOCX sin texto extraíble]"
    except Exception as e:
        logger.warning("DOCX extraction failed: %s", e)
        return "[Error al extraer texto del DOCX]"


async def get_ai_config(db: AsyncSession, purpose: str = "correction") -> dict:
    """Get active AI provider + model config, fallback to mock if none configured."""
    # Find the default model for this purpose
    field_map = {
        "correction": AIModel.is_default_correction,
        "generation": AIModel.is_default_generation,
        "tutor": AIModel.is_default_tutor,
        "vision": AIModel.is_default_vision,
    }
    filter_field = field_map.get(purpose, AIModel.is_default_correction)

    r = await db.execute(
        select(AIModel, AIProvider)
        .join(AIProvider, AIModel.provider_id == AIProvider.id)
        .where(filter_field == True, AIProvider.is_active == True, AIModel.is_active == True)
    )
    row = r.first()

    # Fallback: any active model from any active provider
    if not row:
        r = await db.execute(
            select(AIModel, AIProvider)
            .join(AIProvider, AIModel.provider_id == AIProvider.id)
            .where(AIProvider.is_active == True, AIModel.is_active == True)
        )
        row = r.first()

    if not row:
        return {"provider": "mock", "model": "mock", "api_key": None}

    model, provider = row

    # Decrypt the API key
    api_key = None
    if provider.api_key_encrypted:
        try:
            api_key = decrypt_value(provider.api_key_encrypted)
        except Exception:
            logger.error("Failed to decrypt API key for provider %s — check FERNET_KEY", provider.slug)
            return {"provider": "mock", "model": "mock", "api_key": None}

    return {
        "provider": provider.slug,
        "model": model.model_id,
        "api_key": api_key,
        "max_tokens": model.max_tokens,
    }


async def call_ai(prompt: str, config: dict = None, file_urls: list[str] | None = None) -> str:
    """Call AI provider, optionally reading file content from file_urls.

    If file_urls are provided, the files are read and their content is
    injected into the prompt (text) or passed as vision parts (images).
    """
    # Read files and build enriched prompt / content parts
    file_contents: list[dict] | None = None
    if file_urls:
        file_contents = []
        for url in file_urls:
            if url:
                fc = await read_file_content(url)
                file_contents.append(fc)

    if not config or config.get("provider") == "mock":
        # For mock, just inject text into the prompt
        enriched = _enrich_prompt_with_files(prompt, file_contents)
        return _mock_response(enriched)
    return await _call_real_provider(prompt, config, file_contents=file_contents)


async def stream_ai(prompt: str, config: dict = None) -> AsyncIterator[str]:
    """Call AI provider with streaming."""
    if not config or config.get("provider") == "mock":
        response = _mock_response(prompt)
        for word in response.split():
            yield word + " "
        return
    async for chunk in _stream_real_provider(prompt, config):
        yield chunk


def _enrich_prompt_with_files(prompt: str, file_contents: list[dict] | None) -> str:
    """Inject text file contents into the prompt string (for text-only calls or mock)."""
    if not file_contents:
        return prompt
    text_parts = []
    for i, fc in enumerate(file_contents):
        if fc["type"] == "text":
            text_parts.append(f"--- Contenido del archivo {i + 1} ---\n{fc['content']}\n--- Fin archivo {i + 1} ---")
        else:
            text_parts.append(f"[Archivo {i + 1}: imagen — se requiere modelo con visión para analizar]")
    file_block = "\n\n".join(text_parts)
    return f"{prompt}\n\n{file_block}"


def _build_openai_messages(prompt: str, file_contents: list[dict] | None) -> list[dict]:
    """Build OpenAI messages array with text + image content parts."""
    if not file_contents or not any(fc["type"] == "image" for fc in file_contents):
        enriched = _enrich_prompt_with_files(prompt, file_contents)
        return [{"role": "user", "content": enriched}]

    # Multi-modal: build content array
    parts: list[dict] = []
    # First inject any text files into the prompt
    text_files = [fc for fc in file_contents if fc["type"] == "text"]
    enriched_prompt = _enrich_prompt_with_files(prompt, text_files)
    parts.append({"type": "text", "text": enriched_prompt})

    # Then add images
    for fc in file_contents:
        if fc["type"] == "image":
            parts.append({
                "type": "image_url",
                "image_url": {"url": f"data:{fc['mime_type']};base64,{fc['content']}"}
            })

    return [{"role": "user", "content": parts}]


def _build_gemini_parts(prompt: str, file_contents: list[dict] | None) -> list[dict]:
    """Build Gemini parts array with text + inline images."""
    if not file_contents or not any(fc["type"] == "image" for fc in file_contents):
        enriched = _enrich_prompt_with_files(prompt, file_contents)
        return [{"text": enriched}]

    parts: list[dict] = []
    text_files = [fc for fc in file_contents if fc["type"] == "text"]
    enriched_prompt = _enrich_prompt_with_files(prompt, text_files)
    parts.append({"text": enriched_prompt})

    for fc in file_contents:
        if fc["type"] == "image":
            parts.append({
                "inline_data": {
                    "mime_type": fc["mime_type"],
                    "data": fc["content"],
                }
            })

    return parts


def _build_anthropic_messages(prompt: str, file_contents: list[dict] | None) -> list[dict]:
    """Build Anthropic messages with text + image content blocks."""
    if not file_contents or not any(fc["type"] == "image" for fc in file_contents):
        enriched = _enrich_prompt_with_files(prompt, file_contents)
        return [{"role": "user", "content": enriched}]

    content_blocks: list[dict] = []
    text_files = [fc for fc in file_contents if fc["type"] == "text"]
    enriched_prompt = _enrich_prompt_with_files(prompt, text_files)
    content_blocks.append({"type": "text", "text": enriched_prompt})

    for fc in file_contents:
        if fc["type"] == "image":
            content_blocks.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": fc["mime_type"],
                    "data": fc["content"],
                }
            })

    return [{"role": "user", "content": content_blocks}]


async def _call_real_provider(prompt: str, config: dict, file_contents: list[dict] | None = None) -> str:
    """Call actual AI provider with error handling and retry."""
    import asyncio
    provider = config.get("provider", "").lower()
    if provider not in ("openai", "gemini", "anthropic"):
        raise RuntimeError(f"Proveedor de IA no soportado: {provider}")

    last_error = None
    for attempt in range(AI_MAX_RETRIES + 1):
        start = time.time()
        try:
            if provider == "openai":
                result = await _call_openai(prompt, config, file_contents=file_contents)
            elif provider == "gemini":
                result = await _call_gemini(prompt, config, file_contents=file_contents)
            else:
                result = await _call_anthropic(prompt, config, file_contents=file_contents)
            elapsed = time.time() - start
            logger.info("AI call success: provider=%s model=%s latency=%.1fs attempt=%d", provider, config.get("model"), elapsed, attempt + 1)
            return result
        except httpx.TimeoutException as e:
            last_error = e
            logger.warning("AI call timeout attempt %d/%d: provider=%s", attempt + 1, AI_MAX_RETRIES + 1, provider)
        except httpx.HTTPError as e:
            last_error = e
            logger.warning("AI call HTTP error attempt %d/%d: provider=%s error=%s", attempt + 1, AI_MAX_RETRIES + 1, provider, str(e))
        except RuntimeError:
            raise  # Don't retry API errors (4xx)
        except Exception as e:
            last_error = e
            logger.error("AI call error: provider=%s error=%s", provider, str(e))
            raise

        if attempt < AI_MAX_RETRIES:
            await asyncio.sleep(2 ** attempt)  # Exponential backoff: 1s, 2s

    logger.error("AI call failed after %d attempts: provider=%s", AI_MAX_RETRIES + 1, provider)
    if isinstance(last_error, httpx.TimeoutException):
        raise RuntimeError(f"El proveedor de IA ({provider}) no respondió a tiempo después de {AI_MAX_RETRIES + 1} intentos.")
    raise RuntimeError(f"Error de conexión con el proveedor de IA: {last_error}")


async def _stream_real_provider(prompt: str, config: dict) -> AsyncIterator[str]:
    """Stream from actual AI provider."""
    provider = config.get("provider", "").lower()
    try:
        if provider == "openai":
            async for chunk in _stream_openai(prompt, config):
                yield chunk
        elif provider == "gemini":
            async for chunk in _stream_gemini(prompt, config):
                yield chunk
        else:
            async for chunk in _stream_mock(prompt):
                yield chunk
    except httpx.TimeoutException:
        logger.error("AI stream timeout: provider=%s", provider)
        yield "\n\n[Error: El proveedor de IA no respondió a tiempo]"
    except Exception as e:
        logger.error("AI stream error: provider=%s error=%s", provider, str(e))
        yield f"\n\n[Error: {e}]"


async def _call_openai(prompt: str, config: dict, file_contents: list[dict] | None = None) -> str:
    """Call OpenAI API."""
    messages = _build_openai_messages(prompt, file_contents)
    async with httpx.AsyncClient(timeout=AI_TIMEOUT) as client:
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {config.get('api_key')}"},
            json={
                "model": config.get("model", "gpt-4o"),
                "messages": messages,
                "max_tokens": config.get("max_tokens", 2000),
            },
        )
        if response.status_code != 200:
            raise RuntimeError(f"OpenAI API error {response.status_code}: {response.text[:200]}")
        data = response.json()
        return data.get("choices", [{}])[0].get("message", {}).get("content", "")


async def _call_gemini(prompt: str, config: dict, file_contents: list[dict] | None = None) -> str:
    """Call Google Gemini API."""
    parts = _build_gemini_parts(prompt, file_contents)
    async with httpx.AsyncClient(timeout=AI_TIMEOUT) as client:
        response = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{config.get('model')}:generateContent",
            params={"key": config.get("api_key")},
            json={"contents": [{"parts": parts}]},
        )
        if response.status_code != 200:
            raise RuntimeError(f"Gemini API error {response.status_code}: {response.text[:200]}")
        data = response.json()
        return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")


async def _call_anthropic(prompt: str, config: dict, file_contents: list[dict] | None = None) -> str:
    """Call Anthropic Claude API."""
    messages = _build_anthropic_messages(prompt, file_contents)
    async with httpx.AsyncClient(timeout=AI_TIMEOUT) as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": config.get("api_key"),
                "anthropic-version": "2023-06-01",
            },
            json={
                "model": config.get("model", "claude-sonnet-4-6"),
                "max_tokens": config.get("max_tokens", 2000),
                "messages": messages,
            },
        )
        if response.status_code != 200:
            raise RuntimeError(f"Anthropic API error {response.status_code}: {response.text[:200]}")
        data = response.json()
        return data.get("content", [{}])[0].get("text", "")


async def _stream_openai(prompt: str, config: dict) -> AsyncIterator[str]:
    """Stream from OpenAI."""
    async with httpx.AsyncClient(timeout=AI_STREAM_TIMEOUT) as client:
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
        ) as response:
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    try:
                        data = json.loads(line[6:])
                        yield data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                    except (json.JSONDecodeError, IndexError, KeyError):
                        pass


async def _stream_gemini(prompt: str, config: dict) -> AsyncIterator[str]:
    """Stream from Gemini."""
    async with httpx.AsyncClient(timeout=AI_STREAM_TIMEOUT) as client:
        async with client.stream(
            "POST",
            f"https://generativelanguage.googleapis.com/v1beta/models/{config.get('model')}:streamGenerateContent",
            params={"key": config.get("api_key")},
            json={"contents": [{"parts": [{"text": prompt}]}]},
        ) as response:
            async for line in response.aiter_lines():
                try:
                    data = json.loads(line)
                    yield data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                except (json.JSONDecodeError, IndexError, KeyError):
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
        except (json.JSONDecodeError, ValueError):
            pass
    # Try finding JSON object
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except (json.JSONDecodeError, ValueError):
            pass
    return None
