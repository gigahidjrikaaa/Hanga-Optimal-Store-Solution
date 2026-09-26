FROM python:3.11-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Copy pyproject and application code
COPY pyproject.toml ./
COPY app/ ./app/

# Install dependencies and package
RUN pip install --no-cache-dir .

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
