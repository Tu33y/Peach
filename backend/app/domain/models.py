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

    # EPIC 0 additions
    is_adult_verified = Column(Boolean, default=False)
    identity_verified = Column(Boolean, default=False)
    verification_status = Column(String, default="pending") # pending, approved, rejected, suspended

    # 2FA info
    two_factor_secret = Column(String, nullable=True)
    two_factor_enabled = Column(Boolean, default=False)

    profile = relationship("DBProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    wallet = relationship("DBWallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    services = relationship("DBService", back_populates="provider")
    orders_as_client = relationship("DBOrder", back_populates="client", foreign_keys="DBOrder.client_id")
    orders_as_provider = relationship("DBOrder", back_populates="provider", foreign_keys="DBOrder.provider_id")

    # New relationships for safety and compliance
    verification_requests = relationship(
        "DBVerificationRequest",
        back_populates="user",
        foreign_keys="DBVerificationRequest.user_id",
        cascade="all, delete-orphan"
    )
    reviewed_requests = relationship(
        "DBVerificationRequest",
        back_populates="reviewer",
        foreign_keys="DBVerificationRequest.reviewer_id"
    )
    documents = relationship("DBDocument", back_populates="user", cascade="all, delete-orphan")
    consent_records = relationship("DBConsentRecord", back_populates="user", cascade="all, delete-orphan")
    safety_events = relationship("DBSafetyEvent", back_populates="user", cascade="all, delete-orphan")
    checkins = relationship("DBCheckIn", back_populates="user", cascade="all, delete-orphan")


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

    # EPIC Geolocalizzazione additions
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    city = Column(String, nullable=True)
    postcode = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    # EPICS additions
    languages = Column(String, nullable=True) # comma separated languages
    rules = Column(Text, nullable=True)
    status = Column(String, default="active") # active, inactive, suspended

    provider = relationship("DBUser", back_populates="services")
    category = relationship("DBCategory", back_populates="services")
    orders = relationship("DBOrder", back_populates="service")
    images = relationship("DBServiceImage", back_populates="service", cascade="all, delete-orphan")


class DBServiceImage(Base):
    __tablename__ = "service_images"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    service_id = Column(String, ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    url = Column(String, nullable=False)
    order = Column(Integer, default=0)

    service = relationship("DBService", back_populates="images")


class DBSellerAvailability(Base):
    __tablename__ = "seller_availabilities"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    day = Column(String, nullable=False) # e.g. "Monday", "Tuesday", etc.
    start_time = Column(String, nullable=False) # e.g. "09:00"
    end_time = Column(String, nullable=False) # e.g. "17:00"
    available = Column(Boolean, default=True)


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

    # Reputation Score additions (scheduled start/end times and actual start/end times)
    scheduled_start_time = Column(DateTime, nullable=True)
    scheduled_end_time = Column(DateTime, nullable=True)
    actual_start_time = Column(DateTime, nullable=True)
    actual_completion_time = Column(DateTime, nullable=True)

    client = relationship("DBUser", back_populates="orders_as_client", foreign_keys=[client_id])
    provider = relationship("DBUser", back_populates="orders_as_provider", foreign_keys=[provider_id])
    service = relationship("DBService", back_populates="orders")
    transactions = relationship("DBTransaction", back_populates="order")
    safety_events = relationship("DBSafetyEvent", back_populates="booking", cascade="all, delete-orphan")
    checkins = relationship("DBCheckIn", back_populates="booking", cascade="all, delete-orphan")


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


class DBChat(Base):
    __tablename__ = "chats"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user1 = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user2 = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(String, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("DBMessage", back_populates="chat", cascade="all, delete-orphan")


class DBMessage(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    chat_id = Column(String, ForeignKey("chats.id", ondelete="CASCADE"), nullable=True)
    sender_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    text = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Chat additions
    attachment = Column(String, nullable=True) # file URL for attachments or images
    sent_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime, nullable=True)
    first_response_at = Column(DateTime, nullable=True)

    chat = relationship("DBChat", back_populates="messages")


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


# EPIC 0 Compliance & Legalità tables

class DBVerificationRequest(Base):
    __tablename__ = "verification_requests"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False) # e.g. "identity", "age"
    status = Column(String, default="pending") # pending, approved, rejected, suspended
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)
    reviewer_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reason = Column(Text, nullable=True)

    user = relationship("DBUser", back_populates="verification_requests", foreign_keys=[user_id])
    reviewer = relationship("DBUser", back_populates="reviewed_requests", foreign_keys=[reviewer_id])


class DBDocument(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String, nullable=False) # e.g. "passport", "id_card", "driver_license"
    file_url = Column(String, nullable=False)
    status = Column(String, default="pending") # pending, approved, rejected
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)

    user = relationship("DBUser", back_populates="documents")


class DBConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    consent_type = Column(String, nullable=False) # terms, privacy, platform_usage
    version = Column(String, nullable=False) # e.g. "v1.0"
    accepted_at = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, nullable=True)

    user = relationship("DBUser", back_populates="consent_records")


# EPIC Safety tables

class DBSafetyEvent(Base):
    __tablename__ = "safety_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    booking_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=True)
    type = Column(String, nullable=False) # e.g. "SOS", "harassment", "danger"
    location = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active") # active, resolved

    user = relationship("DBUser", back_populates="safety_events")
    booking = relationship("DBOrder", back_populates="safety_events")


class DBCheckIn(Base):
    __tablename__ = "checkins"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    booking_id = Column(String, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False) # e.g. "pre-appointment", "post-appointment"
    timestamp = Column(DateTime, default=datetime.utcnow)
    location = Column(String, nullable=True)

    user = relationship("DBUser", back_populates="checkins")
    booking = relationship("DBOrder", back_populates="checkins")


# EPIC Reputazione

class DBReputationScore(Base):
    __tablename__ = "reputation_scores"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, default=0.0)
    type = Column(String, nullable=False) # "seller", "customer"
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
