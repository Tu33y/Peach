import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, Float, ForeignKey, Integer, Text, Table
from sqlalchemy.orm import relationship
from app.infrastructure.database import Base

# Many-to-many relationship helper table for category and services if needed,
# but let's stick to a straightforward relationship to Category.

class DBUser(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="client") # "client", "provider", "admin"
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active") # "active", "suspended"
    reliability_level = Column(String, default="new_user") # "new_user", "verified", "reliable", "professional"
    is_verified = Column(Boolean, default=False)

    # 2FA info
    two_factor_secret = Column(String, nullable=True)
    two_factor_enabled = Column(Boolean, default=False)

    profile = relationship("DBProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    wallet = relationship("DBWallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    services = relationship("DBService", back_populates="provider")
    orders_as_client = relationship("DBOrder", back_populates="client", foreign_keys="DBOrder.client_id")
    orders_as_provider = relationship("DBOrder", back_populates="provider", foreign_keys="DBOrder.provider_id")


class DBProfile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    description = Column(Text, nullable=True)
    avatar_url = Column(String, nullable=True)
    reputation_score = Column(Float, default=0.0)
    rating_average = Column(Float, default=0.0)
    services_count = Column(Integer, default=0)
    days_on_platform = Column(Integer, default=0)

    user = relationship("DBUser", back_populates="profile")


class DBCategory(Base):
    __tablename__ = "categories"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)

    services = relationship("DBService", back_populates="category")


class DBService(Base):
    __tablename__ = "services"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    provider_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category_id = Column(String, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True)
    location_general = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("DBUser", back_populates="services")
    category = relationship("DBCategory", back_populates="services")
    orders = relationship("DBOrder", back_populates="service")


class DBOrder(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(String, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    price = Column(Float, nullable=False)
    platform_fee = Column(Float, nullable=False)
    status = Column(String, default="pending") # "pending", "accepted", "completed", "cancelled", "disputed"
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("DBUser", back_populates="orders_as_client", foreign_keys=[client_id])
    provider = relationship("DBUser", back_populates="orders_as_provider", foreign_keys=[provider_id])
    service = relationship("DBService", back_populates="orders")
    transactions = relationship("DBTransaction", back_populates="order")


class DBWallet(Base):
    __tablename__ = "wallets"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    balance = Column(Float, default=0.0)
    escrow_balance = Column(Float, default=0.0)

    user = relationship("DBUser", back_populates="wallet")


class DBTransaction(Base):
    __tablename__ = "transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_id = Column(String, ForeignKey("wallets.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(String, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False) # "deposit", "withdraw", "escrow_lock", "escrow_release", "fee", "refund"
    status = Column(String, default="completed") # "completed", "failed"
    balance_before = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("DBOrder", back_populates="transactions")


class DBMessage(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class DBReview(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, unique=True)
    reviewer_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewee_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class DBReport(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    reporter_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reported_user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(String, default="pending") # "pending", "resolved", "dismissed"
    created_at = Column(DateTime, default=datetime.utcnow)


class DBAuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    admin_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    target_id = Column(String, nullable=True)
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
