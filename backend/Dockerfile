FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt fastapi uvicorn

COPY src/app/core/ src/app/core/
COPY src/app/__init__.py src/app/__init__.py
COPY backend/ backend/
COPY data-agent-task/ data-agent-task/
COPY .env* ./

ENV PYTHONPATH=/app/src:/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
