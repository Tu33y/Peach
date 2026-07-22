from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List
from app.infrastructure.database import get_db
from app.infrastructure.repositories import OrderRepository, ServiceRepository, WalletRepository, ReviewRepository, UserRepository
from app.domain.models import DBOrder, DBUser, DBReview
from app.presentation.schemas import OrderCreate, OrderResponse, ReviewCreate, ReviewResponse
from app.presentation.auth_router import get_current_user
from app.application.payment_service import PaymentService
from app.application.events import event_bus
from app.core.config import settings
from app.core.logging import logger
from datetime import datetime
from app.application.reputation_service import calculate_seller_reputation, calculate_customer_reputation

router = APIRouter(tags=["Orders & Bookings"])

@router.post("/requests", response_model=OrderResponse)
def create_order_request(
    order_data: OrderCreate,
    background_tasks: BackgroundTasks,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    service_repo = ServiceRepository(db)
    service = service_repo.get_by_id(order_data.service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.provider_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot order your own service")

    order_repo = OrderRepository(db)
    platform_fee = service.price * (settings.PLATFORM_FEE_PERCENTAGE / 100.0)

    try:
        order = DBOrder(
            client_id=current_user.id,
            provider_id=service.provider_id,
            service_id=service.id,
            price=service.price,
            platform_fee=platform_fee,
            status="pending",
            scheduled_start_time=order_data.scheduled_start_time,
            scheduled_end_time=order_data.scheduled_end_time
        )
        order_repo.create(order)
        db.commit()
        db.refresh(order)
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create order request: {str(e)}")
        raise HTTPException(status_code=500, detail="Order request initiation failed")

    background_tasks.add_task(event_bus.publish, "OrderCreated", {"order_id": order.id})
    return order

@router.get("/requests", response_model=List[OrderResponse])
def get_orders(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    order_repo = OrderRepository(db)
    if current_user.role == "admin":
        return order_repo.get_all()
    elif current_user.role == "provider":
        return order_repo.get_by_provider_id(current_user.id)
    else:
        return order_repo.get_by_client_id(current_user.id)

@router.put("/requests/{order_id}/status", response_model=OrderResponse)
def update_order_status(
    order_id: str,
    new_status: str,
    background_tasks: BackgroundTasks,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_repo = OrderRepository(db)
    wallet_repo = WalletRepository(db)
    payment_service = PaymentService(wallet_repo, order_repo)

    order = order_repo.get_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    is_client = order.client_id == current_user.id
    is_provider = order.provider_id == current_user.id
    is_admin = current_user.role == "admin"

    if not (is_client or is_provider or is_admin):
        raise HTTPException(status_code=403, detail="Unauthorized order access")

    old_status = order.status

    # Atomic operations wrapped in high-level DB transaction commit block
    try:
        if new_status == "accepted":
            if not is_provider and not is_admin:
                raise HTTPException(status_code=403, detail="Only providers can accept orders")
            if old_status != "pending":
                raise HTTPException(status_code=400, detail="Can only accept pending orders")

            # Atomic lock to Escrow
            success = payment_service.lock_funds_to_escrow(order)
            if not success:
                raise HTTPException(status_code=400, detail="Client has insufficient funds to lock in escrow")

            order.status = "accepted"
            order.actual_start_time = datetime.utcnow()
            background_tasks.add_task(event_bus.publish, "PaymentLocked", {"order_id": order.id})

        elif new_status == "completed":
            if not is_provider and not is_admin:
                raise HTTPException(status_code=403, detail="Only providers/admin can mark complete")
            if old_status != "accepted":
                raise HTTPException(status_code=400, detail="Order must be accepted first")

            success = payment_service.release_funds_from_escrow(order)
            if not success:
                raise HTTPException(status_code=500, detail="Escrow release transaction failed")

            order.status = "completed"
            order.actual_completion_time = datetime.utcnow()
            background_tasks.add_task(event_bus.publish, "OrderCompleted", {"order_id": order.id})

            # Recalculate seller and customer reputations
            calculate_seller_reputation(order.provider_id, db)
            calculate_customer_reputation(order.client_id, db)

        elif new_status == "cancelled":
            if old_status == "pending":
                order.status = "cancelled"
            elif old_status == "accepted":
                success = payment_service.refund_funds_from_escrow(order)
                if not success:
                    raise HTTPException(status_code=500, detail="Escrow refund failed")
                order.status = "cancelled"
            else:
                raise HTTPException(status_code=400, detail="Cannot cancel completed orders")

            # Recalculate customer reputation on cancel
            calculate_customer_reputation(order.client_id, db)

        elif new_status == "disputed":
            if old_status != "accepted":
                raise HTTPException(status_code=400, detail="Can only dispute active/accepted orders")
            order.status = "disputed"

        else:
            raise HTTPException(status_code=400, detail="Invalid status change requested")

        order_repo.update(order)
        db.commit()
        db.refresh(order)
        return order
    except Exception as e:
        db.rollback()
        logger.error(f"Atomic update of order {order_id} failed: {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail="Internal server transaction failure")

@router.post("/reviews", response_model=ReviewResponse)
def create_review(
    review_data: ReviewCreate,
    background_tasks: BackgroundTasks,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order_repo = OrderRepository(db)
    review_repo = ReviewRepository(db)
    user_repo = UserRepository(db)

    order = order_repo.get_by_id(review_data.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != "completed":
        raise HTTPException(status_code=400, detail="Cannot review an incomplete order")
    if order.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the ordering client can review this service")

    existing = review_repo.get_by_order_id(order.id)
    if existing:
        raise HTTPException(status_code=400, detail="Order already reviewed")

    try:
        review = DBReview(
            order_id=order.id,
            reviewer_id=current_user.id,
            reviewee_id=order.provider_id,
            rating=review_data.rating,
            comment=review_data.comment
        )
        review_repo.create(review)

        # Trigger live reputation update via reputation calculation service
        calculate_seller_reputation(order.provider_id, db)

        db.commit()
        db.refresh(review)
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to submit review: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal review posting failure")

    background_tasks.add_task(event_bus.publish, "ReviewCreated", {"review_id": review.id})
    return review
