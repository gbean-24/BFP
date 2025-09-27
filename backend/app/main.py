from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import create_tables
from app.simple_routes import router as simple_router
from app.routes import router as secure_router

app = FastAPI(
    title="Tourism Safety Emergency Tracker API",
    description="API for tracking traveler safety and managing emergency alerts",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

# Include both simple and secure routes
app.include_router(simple_router, prefix="/api/simple")
app.include_router(secure_router, prefix="/api/secure")

@app.get("/")
async def root():
    return {
        "message": "Tourism Safety Emergency Tracker API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "simple": "/api/simple/* (no auth required)",
            "secure": "/api/secure/* (authentication required)",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
