from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.infrastructure.database import get_db
from app.infrastructure.repositories import ServiceRepository, CategoryRepository, ProfileRepository, UserRepository, WalletRepository
from app.domain.models import DBService, DBCategory, DBUser, DBProfile, DBServiceImage, DBSellerAvailability, DBReview, DBOrder, DBDocument, DBVerificationRequest
from app.presentation.schemas import (
    ServiceCreate, ServiceResponse, CategoryResponse, ProfileResponse, ProfileUpdate,
    SellerAvailabilityCreate, SellerAvailabilityResponse, ServiceImageCreate
)
from app.presentation.auth_router import get_current_user
from app.infrastructure.geocoding import NominatimGeocodingService, calculate_haversine_distance
from app.infrastructure.redis_client import redis_client
import json

router = APIRouter(tags=["Services & Profiles"])

@router.get("/categories", response_model=List[CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    cat_repo = CategoryRepository(db)
    return cat_repo.get_all()

@router.post("/services", response_model=ServiceResponse)
def create_service(service_data: ServiceCreate, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "provider" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only providers can create services")

    # Geocode location using city/postcode
    lat, lon = None, None
    address_str = ""
    if service_data.city:
        address_str += service_data.city
    if service_data.postcode:
        address_str += f" {service_data.postcode}"

    if address_str:
        geocoder = NominatimGeocodingService()
        coords = geocoder.geocode(address_str)
        if coords:
            lat, lon = coords

    new_service = DBService(
        provider_id=current_user.id,
        category_id=service_data.category_id,
        title=service_data.title,
        description=service_data.description,
        price=service_data.price,
        city=service_data.city,
        postcode=service_data.postcode,
        latitude=lat,
        longitude=lon,
        languages=service_data.languages,
        rules=service_data.rules,
        status="active"
    )
    db.add(new_service)
    db.flush()

    # Create service images
    if service_data.images:
        for idx, img in enumerate(service_data.images):
            db_img = DBServiceImage(
                service_id=new_service.id,
                url=img.url,
                order=img.order or idx
            )
            db.add(db_img)

    db.commit()
    db.refresh(new_service)

    # Clear Redis search cache
    redis_client.delete("search_cache_keys")
    return new_service

@router.get("/services", response_model=List[ServiceResponse])
def search_services(
    query: Optional[str] = None,
    category_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    radius: Optional[float] = None, # in kilometers
    sort_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    service_repo = ServiceRepository(db)
    # Search via repository query
    services = service_repo.search(query, category_id, min_price, max_price, sort_by)

    # Apply geocoding radius filter if requested
    if lat is not None and lon is not None and radius is not None:
        filtered = []
        for s in services:
            if s.latitude is not None and s.longitude is not None:
                dist = calculate_haversine_distance(lat, lon, s.latitude, s.longitude)
                if dist <= radius:
                    filtered.append(s)
        services = filtered

    # Sort by distance if requested
    if sort_by == "distance" and lat is not None and lon is not None:
        services = sorted(
            services,
            key=lambda s: calculate_haversine_distance(lat, lon, s.latitude, s.longitude) if s.latitude is not None else 999999
        )

    return services

@router.get("/services/{service_id}", response_model=ServiceResponse)
def get_service_by_id(service_id: str, db: Session = Depends(get_db)):
    service_repo = ServiceRepository(db)
    service = service_repo.get_by_id(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return service

@router.put("/services/{service_id}", response_model=ServiceResponse)
def update_service(
    service_id: str,
    service_data: ServiceCreate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service_repo = ServiceRepository(db)
    service = service_repo.get_by_id(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.provider_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized modification")

    service.title = service_data.title
    service.description = service_data.description
    service.price = service_data.price
    service.category_id = service_data.category_id
    service.city = service_data.city
    service.postcode = service_data.postcode
    service.languages = service_data.languages
    service.rules = service_data.rules

    # Geocode location
    address_str = ""
    if service_data.city:
        address_str += service_data.city
    if service_data.postcode:
        address_str += f" {service_data.postcode}"

    if address_str:
        geocoder = NominatimGeocodingService()
        coords = geocoder.geocode(address_str)
        if coords:
            service.latitude, service.longitude = coords

    # Overwrite images
    db.query(DBServiceImage).filter(DBServiceImage.service_id == service.id).delete()
    if service_data.images:
        for idx, img in enumerate(service_data.images):
            db_img = DBServiceImage(
                service_id=service.id,
                url=img.url,
                order=img.order or idx
            )
            db.add(db_img)

    db.commit()
    db.refresh(service)
    return service

@router.delete("/services/{service_id}")
def delete_service(service_id: str, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    service_repo = ServiceRepository(db)
    service = service_repo.get_by_id(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.provider_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized deletion")
    service_repo.delete(service_id)
    return {"status": "deleted"}


# Seller Availability Endpoints
@router.post("/availability", response_model=SellerAvailabilityResponse)
def set_availability(
    avail_data: SellerAvailabilityCreate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "provider" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only providers can manage availability")

    # If day already set, update, else create
    avail = db.query(DBSellerAvailability).filter(
        DBSellerAvailability.seller_id == current_user.id,
        DBSellerAvailability.day == avail_data.day
    ).first()
    if not avail:
        avail = DBSellerAvailability(
            seller_id=current_user.id,
            day=avail_data.day,
            start_time=avail_data.start_time,
            end_time=avail_data.end_time,
            available=avail_data.available
        )
        db.add(avail)
    else:
        avail.start_time = avail_data.start_time
        avail.end_time = avail_data.end_time
        avail.available = avail_data.available

    db.commit()
    db.refresh(avail)
    return avail

@router.get("/availability/{seller_id}", response_model=List[SellerAvailabilityResponse])
def get_availability(seller_id: str, db: Session = Depends(get_db)):
    return db.query(DBSellerAvailability).filter(DBSellerAvailability.seller_id == seller_id).all()


# PROFILE SEP: Public Profile Detail Endpoint (Safety Compliant - Hidden Precise Address/Docs)
@router.get("/profiles/{user_id}/public")
def get_public_profile(user_id: str, db: Session = Depends(get_db)):
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(DBProfile).filter(DBProfile.user_id == user_id).first()
    services = db.query(DBService).filter(DBService.provider_id == user_id, DBService.status == "active").all()
    availability = db.query(DBSellerAvailability).filter(DBSellerAvailability.seller_id == user_id).all()
    reviews = db.query(DBReview).filter(DBReview.reviewee_id == user_id).all()

    # Calculate reputation
    reputation_score = 100.0
    rep_record = db.query(DBUser).filter(DBUser.id == user_id).first() # Or fallback to reputation_scores
    from app.application.reputation_service import calculate_seller_reputation
    try:
        reputation_score = calculate_seller_reputation(user_id, db)
    except Exception:
        pass

    return {
        "id": user.id,
        "username": user.username,
        "avatar_url": profile.avatar_url if profile else None,
        "description": profile.description if profile else "",
        "badge_verified": user.is_verified,
        "verification_status": user.verification_status,
        "reputation_score": reputation_score,
        "rating_average": profile.rating_average if profile else 0.0,
        "services": [
            {
                "id": s.id,
                "title": s.title,
                "description": s.description,
                "price": s.price,
                "city": s.city, # Public zone
                "languages": s.languages,
                "images": [{"url": img.url} for img in s.images]
            } for s in services
        ],
        "availability": [
            {
                "day": a.day,
                "start_time": a.start_time,
                "end_time": a.end_time,
                "available": a.available
            } for a in availability
        ],
        "reviews": [
            {
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at
            } for r in reviews
        ]
    }


# PROFILE SEP: Private Profile Detail Endpoint (Exact detailed data, wallet, transactions, files)
@router.get("/profiles/me/private")
def get_private_profile(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(DBProfile).filter(DBProfile.user_id == current_user.id).first()
    wallet = db.query(DBUser).filter(DBUser.id == current_user.id).first() # Placeholder wallet
    wallet_repo = WalletRepository(db)
    my_wallet = wallet_repo.get_by_user_id(current_user.id)
    transactions = wallet_repo.get_transactions_by_wallet_id(my_wallet.id) if my_wallet else []

    documents = db.query(DBDocument).filter(DBDocument.user_id == current_user.id).all()
    requests = db.query(DBVerificationRequest).filter(DBVerificationRequest.user_id == current_user.id).all()

    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role,
        "created_at": current_user.created_at,
        "status": current_user.status,
        "is_verified": current_user.is_verified,
        "is_adult_verified": current_user.is_adult_verified,
        "identity_verified": current_user.identity_verified,
        "verification_status": current_user.verification_status,
        "profile": {
            "avatar_url": profile.avatar_url if profile else None,
            "description": profile.description if profile else "",
            "rating_average": profile.rating_average if profile else 0.0,
            "services_count": profile.services_count if profile else 0
        },
        "wallet": {
            "balance": my_wallet.balance if my_wallet else 0.0,
            "escrow_balance": my_wallet.escrow_balance if my_wallet else 0.0
        },
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "type": t.type,
                "status": t.status,
                "created_at": t.created_at
            } for t in transactions
        ],
        "documents": [
            {
                "id": d.id,
                "document_type": d.document_type,
                "file_url": d.file_url,
                "status": d.status,
                "uploaded_at": d.uploaded_at
            } for d in documents
        ],
        "verification_requests": [
            {
                "id": r.id,
                "type": r.type,
                "status": r.status,
                "submitted_at": r.submitted_at,
                "reviewed_at": r.reviewed_at,
                "reason": r.reason
            } for r in requests
        ]
    }


# Retain profile-update for compatibilities
@router.get("/profiles/{user_id}", response_model=ProfileResponse)
def get_profile(user_id: str, db: Session = Depends(get_db)):
    profile_repo = ProfileRepository(db)
    profile = profile_repo.get_by_user_id(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/profiles/me", response_model=ProfileResponse)
def update_profile(profile_data: ProfileUpdate, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_repo = ProfileRepository(db)
    profile = profile_repo.get_by_user_id(current_user.id)
    if not profile:
        profile = DBProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    if profile_data.description is not None:
        profile.description = profile_data.description
    if profile_data.avatar_url is not None:
        profile.avatar_url = profile_data.avatar_url

    return profile_repo.update(profile)
