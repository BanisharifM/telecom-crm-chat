"""FastAPI dependency injection - shared DB connection and LLM client."""

from __future__ import annotations

import threading
from typing import Any

from openai import OpenAI

from app.core.config import Settings, get_settings
from app.core.database import init_database, init_postgres
from app.core.llm import create_client

# Singletons (initialized in lifespan)
_db: Any = None  # DuckDB connection or None (when using PostgreSQL)
_client: OpenAI | None = None
_settings: Settings | None = None


def init_deps():
    """Initialize database and LLM client (called once at startup)."""
    global _db, _client, _settings
    _settings = get_settings()

    if _settings.database_backend == "postgres":
        init_postgres(_settings.database_url)
        _db = None  # PostgreSQL uses module-level engine
    else:
        _db = init_database(_settings.data_file)

    _client = create_client(_settings)


def get_db() -> Any:
    """Return a database connection/cursor.

    For DuckDB: returns a thread-safe cursor.
    For PostgreSQL: returns None (queries use module-level engine).
    """
    if _settings and _settings.database_backend == "postgres":
        return None  # PostgreSQL uses execute_query_postgres()
    assert _db is not None, "Database not initialized"
    return _db.cursor()


def get_client() -> OpenAI:
    assert _client is not None, "LLM client not initialized"
    return _client


def get_app_settings() -> Settings:
    assert _settings is not None, "Settings not initialized"
    return _settings
