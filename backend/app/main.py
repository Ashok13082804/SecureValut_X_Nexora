import os
import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from .config.settings import settings
from .models.database import Base, engine, SessionLocal
from .services.demo_service import demo_data_service
from .api.routers import (
    auth_router, files_router, shares_router, threats_router,
    ml_router, nlp_router, blockchain_router, analytics_router,
    ueba_router, incidents_router, forensics_router, policies_router,
    audit_router, reports_router, users_router, demo_router
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Seed demo data on startup if enabled
if settings.ENABLE_DEMO_DATA:
    db = SessionLocal()
    try:
        demo_data_service.seed_demo_data(db)
    finally:
        db.close()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Secure File Sharing, Threat Detection and Blockchain-Based Audit Platform",
    version=settings.VERSION,
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all local origins during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security Headers & Request Timing Middleware
@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:;"
    )
    return response

# Global Exception Handler (prevents stack trace leakage)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log securely server-side
    print(f"[SECURITY ALERT] Unhandled exception on {request.method} {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal security or processing error occurred. Incident has been recorded."}
    )

# Include all API Routers under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(files_router, prefix=api_prefix)
app.include_router(shares_router, prefix=api_prefix)
app.include_router(threats_router, prefix=api_prefix)
app.include_router(ml_router, prefix=api_prefix)
app.include_router(nlp_router, prefix=api_prefix)
app.include_router(blockchain_router, prefix=api_prefix)
app.include_router(analytics_router, prefix=api_prefix)
app.include_router(ueba_router, prefix=api_prefix)
app.include_router(incidents_router, prefix=api_prefix)
app.include_router(forensics_router, prefix=api_prefix)
app.include_router(policies_router, prefix=api_prefix)
app.include_router(audit_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)
app.include_router(users_router, prefix=api_prefix)
app.include_router(demo_router, prefix=api_prefix)

# Health Check Endpoints
@app.get("/health")
@app.get("/api/health")
@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "security_posture": "OPTIMAL",
        "timestamp": time.time()
    }

# Serve Frontend static build if present
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
