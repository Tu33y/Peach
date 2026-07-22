import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context

# Add parent path to import models
sys.path.insert(0, '.')

from app.infrastructure.database import Base
from app.core.config import settings
from app.domain.models import (
    DBUser, DBProfile, DBCategory, DBService, DBServiceImage,
    DBSellerAvailability, DBOrder, DBWallet, DBTransaction,
    DBChat, DBMessage, DBReview, DBReport, DBAuditLog,
    DBVerificationRequest, DBDocument, DBConsentRecord,
    DBSafetyEvent, DBCheckIn, DBReputationScore
)

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    url = settings.DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    # Use database URL from core settings
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = settings.DATABASE_URL
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
