"""FastAPI dependency injection — shared DB connection and LLM client."""

from __future__ import annotations

import duckdb
from openai import OpenAI

from app.core.config import Settings, get_settings
from app.core.database import init_database
from app.core.llm import create_client

# Singletons (initialized in lifespan)
_db: duckdb.DuckDBPyConnection | None = None
_client: OpenAI | None = None
_settings: Settings | None = None


def init_deps():
    """Initialize database and LLM client (called once at startup)."""
    global _db, _client, _settings
    _settings = get_settings()
    _db = init_database(_settings.data_file)
    _client = create_client(_settings)


def get_db() -> duckdb.DuckDBPyConnection:
    assert _db is not None, "Database not initialized"
    return _db


def get_client() -> OpenAI:
    assert _client is not None, "LLM client not initialized"
    return _client


def get_app_settings() -> Settings:
    assert _settings is not None, "Settings not initialized"
    return _settings
