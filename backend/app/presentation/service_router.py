from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.infrastructure.database import get_db
from app.infrastructure.repositories import ServiceRepository, CategoryRepository, ProfileRepository
from app.domain.models import DBService, DBCategory, DBUser
from app.presentation.schemas import ServiceCreate, ServiceResponse, CategoryResponse, ProfileResponse, ProfileUpdate
from app.presentation.auth_router import get_current_user
from app.infrastructure.geocoding import NominatimGeocodingService
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

    # Geocode location if provided
    lat, lon = None, None
    if service_data.location_general:
        geocoder = NominatimGeocodingService()
        coords = geocoder.geocode(service_data.location_general)
        if coords:
            lat, lon = coords

    service_repo = ServiceRepository(db)
    new_service = DBService(
        provider_id=current_user.id,
        category_id=service_data.category_id,
        title=service_data.title,
        description=service_data.description,
        price=service_data.price,
        location_general=service_data.location_general,
        latitude=lat,
        longitude=lon
    )
    created = service_repo.create(new_service)

    # Clear Redis search cache
    redis_client.delete("search_cache_keys")
    return created

@router.get("/services", response_model=List[ServiceResponse])
def search_services(
    query: Optional[str] = None,
    category_id: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Optional caching
    cache_key = f"services_search:{query}:{category_id}:{min_price}:{max_price}:{sort_by}"
    cached = redis_client.get(cache_key)
    if cached:
        try:
            return json.loads(cached)
        except Exception:
            pass

    service_repo = ServiceRepository(db)
    services = service_repo.search(query, category_id, min_price, max_price, sort_by)

    # Cache result for 60s
    try:
        # Convert to serialized dict list
        serialized = [
            {
                "id": s.id,
                "provider_id": s.provider_id,
                "category_id": s.category_id,
                "title": s.title,
                "description": s.description,
                "price": s.price,
                "is_available": s.is_available,
                "location_general": s.location_general,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "created_at": s.created_at.isoformat()
            }
            for s in services
        ]
        redis_client.set(cache_key, json.dumps(serialized), ex=60)
    except Exception:
        pass

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
    service.location_general = service_data.location_general

    if service_data.location_general:
        geocoder = NominatimGeocodingService()
        coords = geocoder.geocode(service_data.location_general)
        if coords:
            service.latitude, service.longitude = coords

    updated = service_repo.update(service)
    return updated

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
