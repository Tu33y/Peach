from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.domain.models import DBUser, DBOrder, DBReview, DBMessage, DBReport, DBReputationScore

def calculate_seller_reputation(user_id: str, db: Session) -> float:
    # 1. Reviews Component (40%)
    reviews = db.query(DBReview).filter(DBReview.reviewee_id == user_id).all()
    if reviews:
        avg_rating = sum(r.rating for r in reviews) / len(reviews)
        reviews_score = (avg_rating / 5.0) * 100.0
    else:
        reviews_score = 80.0 # Default starting score for reviews component

    # 2. Punctuality Component (20%)
    orders = db.query(DBOrder).filter(
        DBOrder.provider_id == user_id,
        DBOrder.scheduled_start_time.isnot(None),
        DBOrder.actual_start_time.isnot(None)
    ).all()
    if orders:
        punctual_count = 0
        for order in orders:
            # Let's say if actual_start_time is within 15 minutes of scheduled_start_time, it is punctual
            time_diff = (order.actual_start_time - order.scheduled_start_time).total_seconds()
            if time_diff <= 900: # 15 minutes buffer
                punctual_count += 1
        punctuality_score = (punctual_count / len(orders)) * 100.0
    else:
        punctuality_score = 100.0

    # 3. Completed Orders Component (20%)
    total_orders = db.query(DBOrder).filter(DBOrder.provider_id == user_id).all()
    if total_orders:
        completed_orders = [o for o in total_orders if o.status == "completed"]
        completed_score = (len(completed_orders) / len(total_orders)) * 100.0
    else:
        completed_score = 100.0

    # 4. Response Time Component (20%)
    # Evaluate messages received by this user (the seller) to check how quickly they responded to customers.
    messages = db.query(DBMessage).filter(
        DBMessage.recipient_id == user_id,
        DBMessage.first_response_at.isnot(None),
        DBMessage.sent_at.isnot(None)
    ).all()

    if messages:
        total_resp_time_sec = 0.0
        for msg in messages:
            total_resp_time_sec += (msg.first_response_at - msg.sent_at).total_seconds()
        avg_resp_time_hours = (total_resp_time_sec / len(messages)) / 3600.0

        if avg_resp_time_hours <= 1.0:
            response_score = 100.0
        elif avg_resp_time_hours <= 3.0:
            response_score = 85.0
        elif avg_resp_time_hours <= 6.0:
            response_score = 70.0
        elif avg_resp_time_hours <= 12.0:
            response_score = 50.0
        elif avg_resp_time_hours <= 24.0:
            response_score = 30.0
        else:
            response_score = 10.0
    else:
        response_score = 100.0

    final_score = (0.40 * reviews_score) + (0.20 * punctuality_score) + (0.20 * completed_score) + (0.20 * response_score)

    # Save/Update to reputation_scores
    rep_score_record = db.query(DBReputationScore).filter(
        DBReputationScore.user_id == user_id,
        DBReputationScore.type == "seller"
    ).first()
    if not rep_score_record:
        rep_score_record = DBReputationScore(user_id=user_id, score=final_score, type="seller")
        db.add(rep_score_record)
    else:
        rep_score_record.score = final_score
        rep_score_record.updated_at = datetime.utcnow()

    db.commit()
    return round(final_score, 1)


def calculate_customer_reputation(user_id: str, db: Session) -> float:
    # 1. Completed Bookings rate (40% weight)
    total_orders = db.query(DBOrder).filter(DBOrder.client_id == user_id).all()
    if total_orders:
        completed_orders = [o for o in total_orders if o.status == "completed"]
        cancellations = [o for o in total_orders if o.status == "cancelled"]

        # Rate of completed orders
        completed_rate = len(completed_orders) / len(total_orders)
        completed_score = completed_rate * 100.0

        # Payment Reliability (40% weight) - let's base it on percentage of orders that aren't cancelled or disputed
        not_failed_rate = (len(total_orders) - len(cancellations)) / len(total_orders)
        payment_reliability = not_failed_rate * 100.0
    else:
        completed_score = 100.0
        payment_reliability = 100.0

    # 2. Reports penalization (unresolved reports)
    reports_count = db.query(DBReport).filter(
        DBReport.reported_user_id == user_id,
        DBReport.status == "pending"
    ).count()

    report_penalization = reports_count * 10.0 # Deduct 10 points per unresolved report

    final_score = (0.50 * completed_score) + (0.50 * payment_reliability) - report_penalization
    final_score = max(0.0, min(100.0, final_score)) # Keep within [0, 100]

    # Save/Update to reputation_scores
    rep_score_record = db.query(DBReputationScore).filter(
        DBReputationScore.user_id == user_id,
        DBReputationScore.type == "customer"
    ).first()
    if not rep_score_record:
        rep_score_record = DBReputationScore(user_id=user_id, score=final_score, type="customer")
        db.add(rep_score_record)
    else:
        rep_score_record.score = final_score
        rep_score_record.updated_at = datetime.utcnow()

    db.commit()
    return round(final_score, 1)
