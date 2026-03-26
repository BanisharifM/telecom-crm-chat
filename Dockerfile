# ============================================
# Stage 1: Builder
# ============================================
FROM python:3.13-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/

WORKDIR /app

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

# Install dependencies (cached layer)
COPY pyproject.toml ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev 2>/dev/null || \
    uv pip install --system -r <(uv pip compile pyproject.toml)

# Copy application code
COPY src/ src/
COPY streamlit_app.py .
COPY data-agent-task/ data-agent-task/
COPY .streamlit/ .streamlit/

RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-editable 2>/dev/null || true

# ============================================
# Stage 2: Runtime
# ============================================
FROM python:3.13-slim AS runtime

WORKDIR /app

RUN groupadd --gid 1000 appuser && \
    useradd --uid 1000 --gid 1000 --shell /bin/bash appuser

# Copy virtual environment and app
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/src /app/src
COPY --from=builder /app/streamlit_app.py /app/streamlit_app.py
COPY --from=builder /app/data-agent-task /app/data-agent-task
COPY --from=builder /app/.streamlit /app/.streamlit

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8501

USER appuser

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8501/_stcore/health || exit 1

CMD ["streamlit", "run", "streamlit_app.py", "--server.port=8501", "--server.headless=true", "--server.address=0.0.0.0"]
