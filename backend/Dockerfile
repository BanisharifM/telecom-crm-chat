FROM python:3.13-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt fastapi uvicorn httpx

# Copy application code
COPY src/app/__init__.py src/app/__init__.py
COPY src/app/core/ src/app/core/
COPY backend/ backend/
COPY data-agent-task/ data-agent-task/

ENV PYTHONPATH=/app/src:/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/api/health').raise_for_status()" || exit 1

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
