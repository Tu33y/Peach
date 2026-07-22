from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.infrastructure.database import get_db
from app.infrastructure.repositories import UserRepository, ProfileRepository, WalletRepository
from app.domain.models import DBUser, DBProfile, DBWallet, DBConsentRecord, DBVerificationRequest, DBDocument
from app.application.auth_service import hash_password, verify_password, create_jwt_token, decode_jwt_token, generate_totp_secret, verify_totp_code, generate_totp_qr_base64
from app.presentation.schemas import UserCreate, UserLogin, UserResponse, TokenResponse
from app.core.logging import logger
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> DBUser:
    payload = decode_jwt_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user_id = payload.get("sub")
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.status == "suspended":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is suspended")
    return user

@router.post("/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    existing = user_repo.get_by_username(user_data.username)
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    try:
        hashed = hash_password(user_data.password)
        new_user = DBUser(
            username=user_data.username,
            password_hash=hashed,
            role=user_data.role,
            is_verified=False,
            is_adult_verified=False,
            identity_verified=False,
            verification_status="pending" if user_data.role == "provider" else "approved"
        )
        user_repo.create(new_user)

        profile_repo = ProfileRepository(db)
        new_profile = DBProfile(user_id=new_user.id)
        profile_repo.create(new_profile)

        wallet_repo = WalletRepository(db)
        new_wallet = DBWallet(user_id=new_user.id, balance=1000.0)
        wallet_repo.create(new_wallet)

        # Log consent agreements
        if user_data.accepted_terms:
            consent_terms = DBConsentRecord(
                user_id=new_user.id,
                consent_type="terms",
                version=user_data.consent_version,
                ip_address=user_data.ip_address or "127.0.0.1"
            )
            db.add(consent_terms)

        if user_data.accepted_privacy:
            consent_privacy = DBConsentRecord(
                user_id=new_user.id,
                consent_type="privacy",
                version=user_data.consent_version,
                ip_address=user_data.ip_address or "127.0.0.1"
            )
            db.add(consent_privacy)

        db.commit()
        db.refresh(new_user)
        logger.info(f"User registered successfully: {new_user.username}")
        return new_user
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to register user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal registration failure: {str(e)}")

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    user = user_repo.get_by_username(login_data.username)
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if user.status == "suspended":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is suspended")

    if user.two_factor_enabled:
        if not login_data.totp_code:
            return TokenResponse(
                access_token="",
                refresh_token="",
                token_type="bearer",
                two_factor_required=True
            )
        if not verify_totp_code(user.two_factor_secret, login_data.totp_code):
            raise HTTPException(status_code=400, detail="Invalid 2FA TOTP code")

    access = create_jwt_token({"sub": user.id, "role": user.role})
    refresh = create_jwt_token({"sub": user.id, "role": user.role})
    return TokenResponse(access_token=access, refresh_token=refresh, token_type="bearer")

@router.get("/me", response_model=UserResponse)
def get_me(current_user: DBUser = Depends(get_current_user)):
    return current_user

@router.post("/role")
def update_role(role: str, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if role not in ["client", "provider", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role type")
    current_user.role = role
    db.commit()
    return {"status": "success", "role": role}

@router.post("/2fa/setup")
def setup_2fa(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    secret = generate_totp_secret()
    current_user.two_factor_secret = secret
    db.commit()
    qr_base64 = generate_totp_qr_base64(secret, current_user.username)
    return {"secret": secret, "qr_code_base64": qr_base64}

@router.post("/2fa/enable")
def enable_2fa(code: str, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.two_factor_secret:
        raise HTTPException(status_code=400, detail="2FA setup not initiated")
    if verify_totp_code(current_user.two_factor_secret, code):
        current_user.two_factor_enabled = True
        db.commit()
        return {"status": "enabled"}
    raise HTTPException(status_code=400, detail="Invalid validation code")

@router.post("/2fa/disable")
def disable_2fa(code: str, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.two_factor_enabled:
        raise HTTPException(status_code=400, detail="2FA is not enabled")
    if verify_totp_code(current_user.two_factor_secret, code):
        current_user.two_factor_enabled = False
        current_user.two_factor_secret = None
        db.commit()
        return {"status": "disabled"}
    raise HTTPException(status_code=400, detail="Invalid code")
