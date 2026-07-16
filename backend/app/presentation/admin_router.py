from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.infrastructure.database import get_db
from app.infrastructure.repositories import UserRepository, ReportRepository, AuditLogRepository, OrderRepository
from app.domain.models import DBUser, DBReport, DBAuditLog, DBOrder
from app.presentation.schemas import UserResponse, ReportResponse, AuditLogResponse, ReportCreate
from app.presentation.auth_router import get_current_user
import json

router = APIRouter(prefix="/admin", tags=["Administration"])

def check_admin_role(current_user: DBUser = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return current_user

@router.get("/users", response_model=List[UserResponse])
def list_users(admin: DBUser = Depends(check_admin_role), db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    return user_repo.get_all()

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    new_status: str,
    reason: str,
    admin: DBUser = Depends(check_admin_role),
    db: Session = Depends(get_db)
):
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    old_status = user.status
    user.status = new_status
    user_repo.update(user)

    # Immutability logs via dedicated Audit Log
    audit_repo = AuditLogRepository(db)
    audit = DBAuditLog(
        admin_id=admin.id,
        action="update_user_status",
        target_id=user.id,
        previous_value=json.dumps({"status": old_status}),
        new_value=json.dumps({"status": new_status, "reason": reason})
    )
    audit_repo.create(audit)
    return {"status": "updated"}

@router.post("/reports", response_model=ReportResponse)
def create_user_report(
    report_data: ReportCreate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report_repo = ReportRepository(db)
    report = DBReport(
        reporter_id=current_user.id,
        reported_user_id=report_data.reported_user_id,
        reason=report_data.reason,
        status="pending"
    )
    return report_repo.create(report)

@router.get("/reports", response_model=List[ReportResponse])
def list_reports(admin: DBUser = Depends(check_admin_role), db: Session = Depends(get_db)):
    report_repo = ReportRepository(db)
    return report_repo.get_all()

@router.put("/reports/{report_id}", response_model=ReportResponse)
def resolve_report(
    report_id: str,
    resolution_status: str,
    admin: DBUser = Depends(check_admin_role),
    db: Session = Depends(get_db)
):
    report_repo = ReportRepository(db)
    report = report_repo.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    old_status = report.status
    report.status = resolution_status
    report_repo.update(report)

    # Log action
    audit_repo = AuditLogRepository(db)
    audit = DBAuditLog(
        admin_id=admin.id,
        action="resolve_report",
        target_id=report.id,
        previous_value=json.dumps({"status": old_status}),
        new_value=json.dumps({"status": resolution_status})
    )
    audit_repo.create(audit)
    return report

@router.get("/audit", response_model=List[AuditLogResponse])
def get_audit_logs(admin: DBUser = Depends(check_admin_role), db: Session = Depends(get_db)):
    audit_repo = AuditLogRepository(db)
    return audit_repo.get_all()

@router.get("/stats")
def get_system_stats(admin: DBUser = Depends(check_admin_role), db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    order_repo = OrderRepository(db)

    users = user_repo.get_all()
    orders = order_repo.get_all()

    total_revenue = sum(o.price for o in orders if o.status == "completed")
    platform_earnings = sum(o.platform_fee for o in orders if o.status == "completed")

    return {
        "total_users": len(users),
        "total_orders": len(orders),
        "completed_orders": len([o for o in orders if o.status == "completed"]),
        "total_revenue": total_revenue,
        "platform_earnings": platform_earnings
    }
