"""FastAPI application entry point."""

from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add src to path for shared core imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from backend.api.deps import init_deps
from backend.api.routes import chat, dashboard, explorer, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize DB and LLM client on startup."""
    init_deps()
    yield


app = FastAPI(
    title="TelecomCo CRM API",
    description="Natural-language query API for telecom CRM data",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(health.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(explorer.router, prefix="/api")
