FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend context into /app inside container
COPY . .

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["sh", "-c", "python init_db.py && python seed.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
