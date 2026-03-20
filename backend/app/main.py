import os
import time
import logging
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy import text
from app.config import get_settings
from app.core.database import async_session
from app.api.v1.router import api_router

logger = logging.getLogger("amautia")
settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Rate limiting middleware
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_per_minute: int = 60, auth_requests_per_minute: int = 10):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.auth_rpm = auth_requests_per_minute
        self._requests: dict[str, list[float]] = defaultdict(list)
        self._auth_requests: dict[str, list[float]] = defaultdict(list)
        self._ai_requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window = 60  # 1 minute

        # Clean old entries
        self._requests[client_ip] = [t for t in self._requests[client_ip] if now - t < window]

        # Determine if this is an auth endpoint
        path = request.url.path
        is_auth = path.endswith("/auth/login") or path.endswith("/auth/register")

        if is_auth:
            # Use separate counter for auth endpoints
            self._auth_requests[client_ip] = [t for t in self._auth_requests[client_ip] if now - t < window]
            if len(self._auth_requests[client_ip]) >= self.auth_rpm:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Demasiadas solicitudes. Intenta de nuevo en un minuto."}
                )
            self._auth_requests[client_ip].append(now)
        else:
            # General rate limit
            if len(self._requests[client_ip]) >= self.requests_per_minute:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Demasiadas solicitudes. Intenta de nuevo en un minuto."}
                )
            self._requests[client_ip].append(now)

        # Per-user rate limiting for AI-intensive endpoints
        ai_path_markers = ["/correct", "/generate", "/message"]
        is_ai = any(p in path for p in ai_path_markers)
        if is_ai:
            auth = request.headers.get("authorization", "")
            user_key = f"ai:{auth[-16:]}" if auth else f"ai:{client_ip}"
            now_ts = time.time()
            ai_window = 3600  # 1 hour

            self._ai_requests[user_key] = [
                t for t in self._ai_requests.get(user_key, []) if now_ts - t < ai_window
            ]
            if len(self._ai_requests[user_key]) >= 30:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Limite de solicitudes IA alcanzado. Intenta en una hora."},
                )
            self._ai_requests[user_key].append(now_ts)

        # Clean up old IPs periodically (every ~1000 requests)
        if len(self._requests) > 1000:
            cutoff = now - window
            self._requests = defaultdict(list, {
                ip: times for ip, times in self._requests.items()
                if any(t > cutoff for t in times)
            })
        # Clean up old AI rate limit entries periodically
        if len(self._ai_requests) > 500:
            ai_cutoff = now - 3600
            self._ai_requests = defaultdict(list, {
                key: times for key, times in self._ai_requests.items()
                if any(t > ai_cutoff for t in times)
            })

        return await call_next(request)

app.add_middleware(RateLimitMiddleware, requests_per_minute=120, auth_requests_per_minute=10)

# HTTPS enforcement in production
if os.getenv("ENVIRONMENT", "development").lower() == "production":
    from starlette.middleware.httpsredirect import HTTPSRedirectMiddleware

    class HSTSMiddleware(BaseHTTPMiddleware):
        """Add Strict-Transport-Security header to all responses in production."""
        async def dispatch(self, request: Request, call_next):
            response = await call_next(request)
            response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
            return response

    app.add_middleware(HSTSMiddleware)
    app.add_middleware(HTTPSRedirectMiddleware)
    logger.info("Production mode: HTTPS redirect and HSTS headers enabled")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve uploaded files
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/health")
async def health():
    db_ok = False
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
            db_ok = True
    except Exception:
        pass

    status = "ok" if db_ok else "degraded"
    return {
        "status": status,
        "service": "Amautia API",
        "database": "connected" if db_ok else "disconnected",
        "version": "1.0.0",
    }
