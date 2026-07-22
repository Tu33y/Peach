from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.infrastructure.database import get_db
from app.presentation.auth_router import get_current_user
from app.domain.models import DBUser, DBVerificationRequest, DBDocument, DBConsentRecord, DBAuditLog
from app.infrastructure.storage import LocalStorageService
from app.presentation.schemas import VerificationRequestResponse, DocumentResponse, ConsentRecordResponse, ConsentRecordCreate
from datetime import datetime
from typing import List

router = APIRouter(prefix="/verification", tags=["Verification & Compliance"])

storage_service = LocalStorageService()

@router.post("/submit-verification", response_model=VerificationRequestResponse)
def submit_verification(
    type: str = Form(...), # "identity" or "age"
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If a pending request of this type already exists, don't allow duplicate
    existing = db.query(DBVerificationRequest).filter(
        DBVerificationRequest.user_id == current_user.id,
        DBVerificationRequest.type == type,
        DBVerificationRequest.status == "pending"
    ).first()
    if existing:
        return existing

    new_req = DBVerificationRequest(
        user_id=current_user.id,
        type=type,
        status="pending"
    )
    db.add(new_req)
    current_user.verification_status = "pending"
    db.commit()
    db.refresh(new_req)
    return new_req


@router.post("/upload-document", response_model=DocumentResponse)
async def upload_document(
    document_type: str = Form(...), # e.g. "passport", "id_card", "driver_license"
    file: UploadFile = File(...),
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    file_bytes = await file.read()
    file_url = storage_service.save_file(file_bytes, file.filename)

    new_doc = DBDocument(
        user_id=current_user.id,
        document_type=document_type,
        file_url=file_url,
        status="pending"
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc


@router.get("/status")
def get_verification_status(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    requests = db.query(DBVerificationRequest).filter(DBVerificationRequest.user_id == current_user.id).all()
    documents = db.query(DBDocument).filter(DBDocument.user_id == current_user.id).all()

    return {
        "is_adult_verified": current_user.is_adult_verified,
        "identity_verified": current_user.identity_verified,
        "verification_status": current_user.verification_status,
        "requests": [
            {
                "id": r.id,
                "type": r.type,
                "status": r.status,
                "submitted_at": r.submitted_at,
                "reason": r.reason
            } for r in requests
        ],
        "documents": [
            {
                "id": d.id,
                "document_type": d.document_type,
                "file_url": d.file_url,
                "status": d.status,
                "uploaded_at": d.uploaded_at
            } for d in documents
        ]
    }


@router.post("/consent", response_model=ConsentRecordResponse)
def log_consent(
    consent_data: ConsentRecordCreate,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = DBConsentRecord(
        user_id=current_user.id,
        consent_type=consent_data.consent_type,
        version=consent_data.version,
        ip_address=consent_data.ip_address or "127.0.0.1"
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# Admin Endpoints for Verification & Approvals
@router.get("/admin/requests", response_model=List[VerificationRequestResponse])
def admin_list_requests(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access only")
    return db.query(DBVerificationRequest).filter(DBVerificationRequest.status == "pending").all()


@router.post("/admin/approve/{request_id}")
def admin_approve_request(
    request_id: str,
    reason: str = Form(None),
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access only")

    req = db.query(DBVerificationRequest).filter(DBVerificationRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.status = "approved"
    req.reviewed_at = datetime.utcnow()
    req.reviewer_id = current_user.id
    req.reason = reason

    # Update actual user flags based on request type
    target_user = db.query(DBUser).filter(DBUser.id == req.user_id).first()
    if target_user:
        if req.type == "age" or req.type == "adult":
            target_user.is_adult_verified = True
        elif req.type == "identity":
            target_user.identity_verified = True

        # If both are verified, mark general user verification status
        if target_user.is_adult_verified and target_user.identity_verified:
            target_user.verification_status = "approved"
            target_user.is_verified = True
            target_user.reliability_level = "verified"
        else:
            target_user.verification_status = "partially_approved"
            target_user.is_verified = False

    # Also approve the documents of this user
    docs = db.query(DBDocument).filter(DBDocument.user_id == req.user_id, DBDocument.status == "pending").all()
    for doc in docs:
        doc.status = "approved"
        doc.verified_at = datetime.utcnow()

    # Log audit event
    audit = DBAuditLog(
        admin_id=current_user.id,
        action="approve_verification",
        target_id=target_user.id if target_user else None,
        new_value="approved"
    )
    db.add(audit)

    db.commit()
    return {"status": "success", "detail": "Verification request approved successfully"}


@router.post("/admin/reject/{request_id}")
def admin_reject_request(
    request_id: str,
    reason: str = Form(...),
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access only")

    req = db.query(DBVerificationRequest).filter(DBVerificationRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.status = "rejected"
    req.reviewed_at = datetime.utcnow()
    req.reviewer_id = current_user.id
    req.reason = reason

    target_user = db.query(DBUser).filter(DBUser.id == req.user_id).first()
    if target_user:
        target_user.verification_status = "rejected"
        target_user.is_verified = False

    # Mark documents as rejected too
    docs = db.query(DBDocument).filter(DBDocument.user_id == req.user_id, DBDocument.status == "pending").all()
    for doc in docs:
        doc.status = "rejected"

    audit = DBAuditLog(
        admin_id=current_user.id,
        action="reject_verification",
        target_id=target_user.id if target_user else None,
        new_value="rejected",
        previous_value=reason
    )
    db.add(audit)

    db.commit()
    return {"status": "success", "detail": "Verification request rejected successfully"}
