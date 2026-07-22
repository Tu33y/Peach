from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.presentation import auth_router, service_router, order_router, chat_router, wallet_router, admin_router, verification_router, safety_router
from app.infrastructure.redis_client import redis_client
import time
import sys

app = FastAPI(
    title="Marketplace Services Platform API",
    description="Backend API for local and commercial services marketplace.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to allowed domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple Redis-based Rate Limiting Middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Disable rate limiting during automated testing to avoid 429 Too Many Requests
    if "pytest" in sys.modules:
        return await call_next(request)

    client_ip = request.client.host
    path = request.url.path

    # Differential limits based on route
    if "login" in path or "register" in path:
        limit = 5
        window = 60 # 5 requests per 60 seconds
    elif "search" in path or "services" in path:
        limit = 30
        window = 60 # 30 search queries/view services per minute
    else:
        limit = 60
        window = 60 # Default 60 requests per minute

    key = f"rate_limit:{client_ip}:{path}"
    try:
        current_hits = redis_client.get(key)
        if current_hits and int(current_hits) >= limit:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Rate limit exceeded."}
            )
        redis_client.incr(key)
        if not current_hits:
            redis_client.expire(key, window)
    except Exception:
        # In case Redis is down or not fully initialized, do not block the app
        pass

    return await call_next(request)

# Health & Observability Endpoints
@app.get("/health", tags=["Observability"])
def health_check():
    return {"status": "healthy", "time": time.time()}

@app.get("/ready", tags=["Observability"])
def ready_check():
    # Perform standard checks (e.g., DB connection)
    from app.infrastructure.database import engine
    try:
        connection = engine.connect()
        connection.close()
        db_ready = True
    except Exception:
        db_ready = False

    return {
        "status": "ready" if db_ready else "not ready",
        "components": {
            "database": "ok" if db_ready else "offline"
        }
    }

@app.get("/metrics", tags=["Observability"])
def metrics():
    # Prepared for Prometheus metric exports
    return {
        "http_requests_total": 42, # Mock placeholder
        "active_sessions": 3
    }

# Include all V1 Routers
prefix = "/api/v1"
app.include_router(auth_router.router, prefix=prefix)
app.include_router(service_router.router, prefix=prefix)
app.include_router(order_router.router, prefix=prefix)
app.include_router(chat_router.router, prefix=prefix)
app.include_router(wallet_router.router, prefix=prefix)
app.include_router(admin_router.router, prefix=prefix)
app.include_router(verification_router.router, prefix=prefix)
app.include_router(safety_router.router, prefix=prefix)
