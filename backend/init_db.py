import os
from alembic.config import Config
from alembic import command
from app.infrastructure.database import Base, engine
from app.domain.models import * # Load all models for SQLAlchemy auto-create

def init_db():
    print("Initializing database tables...")
    # Create all tables directly using Base metadata if alembic is not fully migration-managed initially
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized.")

if __name__ == "__main__":
    init_db()
