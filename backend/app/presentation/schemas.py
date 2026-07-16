from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str
    role: str = "client" # "client", "provider", "admin"

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

class ServiceCreate(BaseModel):
    title: str
    description: str
    price: float
    category_id: Optional[str] = None
    location_general: Optional[str] = None

class ServiceResponse(BaseModel):
    id: str
    provider_id: str
    category_id: Optional[str] = None
    title: str
    description: str
    price: float
    is_available: bool
    location_general: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    service_id: str

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


class MessageCreate(BaseModel):
    recipient_id: str
    text: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    recipient_id: str
    text: str
    is_read: bool
    created_at: datetime

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
