# LavoroHub: Peach Platform (German Safety & Compliance Editions)

Peach Platform is a highly secure, modern, and compliant local services marketplace designed for the German market. This platform provides secure escrow-based transactions, certified identity verifications, age check-ins, and a custom reputation score tracking algorithm alongside real-time WebSocket communication and a premium Airbnb/Revolut-styled Next.js 14 frontend.

---

## Technical Architecture

### 1. Backend Service (FastAPI)
- **Framework:** FastAPI / Python 3.12+
- **Database:** PostgreSQL (with SQLAlchemy 2.x & Alembic migration engine)
- **Cache/Rate Limiting:** Redis
- **Security:** Argon2 credentials hashing, JWT token lifecycle management, and TOTP Multi-factor Authentication (MFA).

### 2. Frontend Interface (Next.js)
- **Framework:** Next.js 14 (App router with Server-Side Rendering)
- **Styles:** Tailwind CSS
- **State Management:** Zustand
- **Asynchronous Queries:** TanStack Query

---

## Getting Started & Installation

### Environment Variables
Create a `.env` file in the repository root (or copy `.env.example`):
```env
# Backend Settings
SECRET_KEY=supersecretkeyfortokengenerationandencryption123!
ALGORITHM=HS256
ENV=production

# Database Settings
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=marketplace
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
DATABASE_URL=postgresql+psycopg2://postgres:postgres@postgres:5432/marketplace

# Redis Cache Settings
REDIS_URL=redis://redis:6379/0

# Next.js Settings
NEXT_PUBLIC_API_URL=http://localhost/api/v1
```

### Docker Compose Quickstart
Start the entire stack including backend, postgres, redis, frontend, and nginx proxy locally using Docker Compose:
```bash
docker compose up -d --build
```
This launches:
- **Nginx Entrypoint:** `http://localhost:80`
- **Next.js Frontend Client:** `http://localhost:3000`
- **FastAPI Backend Server:** `http://localhost:8000`
- **Postgres Database:** `port 5432`
- **Redis Cache:** `port 6379`

---

## Database Migrations (Alembic)

Database tables are completely governed by Alembic schema migrations. To apply migrations or upgrade the Postgres schema:
```bash
# Apply migrations online
PYTHONPATH=backend alembic upgrade head

# Generate a new migration
PYTHONPATH=backend alembic revision --autogenerate -m "migration_name"
```

---

## Running the Automated Test Suite

We maintain extensive end-to-end integration and security test suites using Pytest. Tests run with clean, isolated SQLite databases.
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Execute backend tests
PYTHONPATH=backend pytest
```

---

## Local Development Workflows

### 1. Backend Server (Local)
To run the FastAPI server directly on your host machine:
```bash
cd backend
pip install -r requirements.txt
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Client (Local)
To run the Next.js development server:
```bash
cd frontend
npm install
npm run dev
```

### 3. Production Builds
To build and optimize the Next.js assets for production:
```bash
cd frontend
npm run build
npm run start
```

---

## Key Feature Workflows

- **🆘 Emergency SOS Button:** Constantly accessible in the bottom navigation and top bar. Triggers local Polizei (110) & Feuerwehr (112) safety guidance, logs geo-alerts, and alerts local authorities.
- **🛡️ Consent Logs & Compliance:** Multi-step onboarding captures legal age, terms, and GDPR privacy logs.
- **🔒 Escrow Payments Wallet:** Buyer deposits are held safely in a virtual escrow lock and only released upon verified check-ins and appointment completions.
- **⭐ Reputation Engine:** Calculates dynamic provider levels based on verified customer ratings (40%), punctuality (20%), order completions (20%), and message response times (20%).
