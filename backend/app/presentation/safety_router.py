from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from app.infrastructure.database import get_db
from app.presentation.auth_router import get_current_user
from app.domain.models import DBUser, DBSafetyEvent, DBCheckIn, DBOrder
from app.presentation.schemas import SafetyEventCreate, SafetyEventResponse, CheckInCreate, CheckInResponse

router = APIRouter(prefix="/safety", tags=["Safety & SOS"])

@router.post("/create-event", response_model=SafetyEventResponse)
def create_safety_event(
    event_data: SafetyEventCreate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If booking is provided, verify ownership
    if event_data.booking_id:
        booking = db.query(DBOrder).filter(DBOrder.id == event_data.booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking.client_id != current_user.id and booking.provider_id != current_user.id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this booking")

    new_event = DBSafetyEvent(
        user_id=current_user.id,
        booking_id=event_data.booking_id,
        type=event_data.type,
        location=event_data.location,
        status="active"
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return new_event


@router.post("/checkin", response_model=CheckInResponse)
def create_checkin(
    checkin_data: CheckInCreate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    booking = db.query(DBOrder).filter(DBOrder.id == checkin_data.booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.client_id != current_user.id and booking.provider_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to this booking")

    new_checkin = DBCheckIn(
        booking_id=checkin_data.booking_id,
        user_id=current_user.id,
        type=checkin_data.type,
        location=checkin_data.location
    )
    db.add(new_checkin)

    # If it's a post-appointment issue/flag, we can handle logic (e.g. create report or flag booking)
    if checkin_data.type == "post-appointment" and checkin_data.location == "issue":
        # Can change booking status to disputed
        booking.status = "disputed"

    db.commit()
    db.refresh(new_checkin)
    return new_checkin


@router.get("/events", response_model=List[SafetyEventResponse])
def list_safety_events(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access only")
    return db.query(DBSafetyEvent).all()
