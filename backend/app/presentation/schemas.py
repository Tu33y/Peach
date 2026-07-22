from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role: str = "client" # "client", "provider", "admin"
    accepted_terms: bool = True
    accepted_privacy: bool = True
    consent_version: str = "v1.0"
    ip_address: Optional[str] = None

class UserLogin(UserBase):
    password: str
    totp_code: Optional[str] = None

class UserResponse(UserBase):
    id: str
    role: str
    created_at: datetime
    status: str
    reliability_level: str
    is_verified: bool
    is_adult_verified: bool
    identity_verified: bool
    verification_status: str
    two_factor_enabled: bool

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    two_factor_required: bool = False

class ProfileResponse(BaseModel):
    user_id: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    reputation_score: float
    rating_average: float
    services_count: int
    days_on_platform: int

    class Config:
        from_attributes = True

class ProfileUpdate(BaseModel):
    description: Optional[str] = None
    avatar_url: Optional[str] = None


class CategoryResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


# Advanced Services, Images & Availability schemas
class ServiceImageCreate(BaseModel):
    url: str
    order: Optional[int] = 0

class ServiceImageResponse(BaseModel):
    id: str
    service_id: str
    url: str
    order: int

    class Config:
        from_attributes = True

class SellerAvailabilityCreate(BaseModel):
    day: str
    start_time: str
    end_time: str
    available: Optional[bool] = True

class SellerAvailabilityResponse(BaseModel):
    id: str
    seller_id: str
    day: str
    start_time: str
    end_time: str
    available: bool

    class Config:
        from_attributes = True

class ServiceCreate(BaseModel):
    title: str
    description: str
    price: float
    category_id: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    languages: Optional[str] = None
    rules: Optional[str] = None
    images: Optional[List[ServiceImageCreate]] = []

class ServiceResponse(BaseModel):
    id: str
    provider_id: str
    category_id: Optional[str] = None
    title: str
    description: str
    price: float
    is_available: bool
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    languages: Optional[str] = None
    rules: Optional[str] = None
    status: str
    created_at: datetime
    images: List[ServiceImageResponse] = []

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    service_id: str
    scheduled_start_time: Optional[datetime] = None
    scheduled_end_time: Optional[datetime] = None

class OrderResponse(BaseModel):
    id: str
    client_id: str
    provider_id: str
    service_id: str
    price: float
    platform_fee: float
    status: str
    created_at: datetime
    updated_at: datetime
    scheduled_start_time: Optional[datetime] = None
    scheduled_end_time: Optional[datetime] = None
    actual_start_time: Optional[datetime] = None
    actual_completion_time: Optional[datetime] = None

    class Config:
        from_attributes = True


class WalletResponse(BaseModel):
    id: str
    user_id: str
    balance: float
    escrow_balance: float

    class Config:
        from_attributes = True

class TransactionResponse(BaseModel):
    id: str
    wallet_id: str
    order_id: Optional[str] = None
    amount: float
    type: str
    status: str
    balance_before: float
    balance_after: float
    created_at: datetime

    class Config:
        from_attributes = True


# Chat & Message schemas
class MessageCreate(BaseModel):
    recipient_id: Optional[str] = None
    text: str
    chat_id: Optional[str] = None
    attachment: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    chat_id: Optional[str] = None
    sender_id: str
    recipient_id: Optional[str] = None
    text: str
    attachment: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ChatResponse(BaseModel):
    id: str
    user1: str
    user2: str
    booking_id: Optional[str] = None
    created_at: datetime
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    order_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    order_id: str
    reviewer_id: str
    reviewee_id: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReportCreate(BaseModel):
    reported_user_id: str
    reason: str

class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    reported_user_id: str
    reason: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: str
    admin_id: Optional[str] = None
    action: str
    timestamp: datetime
    target_id: Optional[str] = None
    previous_value: Optional[str] = None
    new_value: Optional[str] = None

    class Config:
        from_attributes = True


# Compliance/Legal/Safety Schemas
class ConsentRecordCreate(BaseModel):
    consent_type: str
    version: str
    ip_address: Optional[str] = None

class ConsentRecordResponse(BaseModel):
    id: str
    user_id: str
    consent_type: str
    version: str
    accepted_at: datetime
    ip_address: Optional[str] = None

    class Config:
        from_attributes = True

class VerificationRequestCreate(BaseModel):
    type: str # e.g. "identity", "age"

class VerificationRequestResponse(BaseModel):
    id: str
    user_id: str
    type: str
    status: str
    submitted_at: datetime
    reviewed_at: Optional[datetime] = None
    reviewer_id: Optional[str] = None
    reason: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: str
    user_id: str
    document_type: str
    file_url: str
    status: str
    uploaded_at: datetime
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SafetyEventCreate(BaseModel):
    booking_id: Optional[str] = None
    type: str # e.g. "SOS"
    location: Optional[str] = None

class SafetyEventResponse(BaseModel):
    id: str
    user_id: str
    booking_id: Optional[str] = None
    type: str
    location: Optional[str] = None
    created_at: datetime
    status: str

    class Config:
        from_attributes = True

class CheckInCreate(BaseModel):
    booking_id: str
    type: str # e.g. "pre-appointment", "post-appointment"
    location: Optional[str] = None

class CheckInResponse(BaseModel):
    id: str
    booking_id: str
    user_id: str
    type: str
    timestamp: datetime
    location: Optional[str] = None

    class Config:
        from_attributes = True
