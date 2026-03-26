"""Application configuration via environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

# Load .env file if present
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent.parent.parent / ".env")


def _get_api_key() -> str:
    """Get API key from environment, .env, or Streamlit secrets."""
    # 1. Try environment variable (set via .env or system)
    key = os.environ.get("OPENROUTER_API_KEY", "")
    if key:
        return key

    # 2. Try Streamlit secrets (for Streamlit Cloud deployment)
    try:
        import streamlit as st
        if hasattr(st, "secrets") and "OPENROUTER_API_KEY" in st.secrets:
            return str(st.secrets["OPENROUTER_API_KEY"])
    except Exception:
        pass

    return ""


@dataclass(frozen=True)
class Settings:
    """Application settings loaded from environment."""

    # OpenRouter API (OpenAI-compatible endpoint)
    openrouter_api_key: str = field(default_factory=_get_api_key)
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    llm_model: str = "anthropic/claude-sonnet-4.6"

    # Database
    data_file: str = "data-agent-task/churn-bigml-full.xlsx"

    # Query settings
    max_retries: int = 3
    query_timeout_seconds: int = 30
    max_result_rows: int = 500

    # App
    log_level: str = field(default_factory=lambda: os.environ.get("LOG_LEVEL", "info"))
    debug: bool = field(
        default_factory=lambda: os.environ.get("DEBUG", "false").lower() == "true"
    )


def get_settings() -> Settings:
    """Get application settings. Creates a new instance each time to pick up secrets."""
    return Settings()
