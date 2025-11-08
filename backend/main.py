"""
Proof of Becoming Backend API
FastAPI application for AI verification, quantum seed generation, and IPFS management
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import os

# Import API routers
from api import ipfs, verify

# Version
VERSION = "0.3.0"

# Create FastAPI app
app = FastAPI(
    title="Proof of Becoming API",
    description="Backend API for proof verification, quantum seed generation, and metadata management",
    version=VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
# Allow frontend to access API
origins = [
    "http://localhost:3000",  # Next.js dev server
    "http://localhost:3001",  # Alternative port
    "http://127.0.0.1:3000",
    os.getenv("FRONTEND_URL", "http://localhost:3000"),  # Production frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(ipfs.router)
app.include_router(verify.router)


# Response models
class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


# Endpoints
@app.get("/")
async def root():
    """Redirect to API documentation"""
    return RedirectResponse(url="/docs")


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint

    Returns service status and version information
    """
    return {
        "status": "ok",
        "service": "pob-backend",
        "version": VERSION,
    }


# Future endpoints (placeholders for Week 5+)
# @app.get("/api/quantum-seed")
# async def get_quantum_seed():
#     """Generate quantum random seed for NFT evolution"""
#     pass

# @app.post("/api/generate-metadata")
# async def generate_metadata(params):
#     """Generate NFT metadata with art URI"""
#     pass
