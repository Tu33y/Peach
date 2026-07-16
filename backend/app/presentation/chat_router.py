from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.infrastructure.database import get_db
from app.infrastructure.repositories import MessageRepository, UserRepository
from app.domain.models import DBMessage, DBUser
from app.presentation.schemas import MessageCreate, MessageResponse
from app.presentation.auth_router import get_current_user

router = APIRouter(tags=["Chat & Messages"])

@router.post("/messages", response_model=MessageResponse)
def send_message(msg_data: MessageCreate, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    recipient = user_repo.get_by_id(msg_data.recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    msg_repo = MessageRepository(db)
    new_msg = DBMessage(
        sender_id=current_user.id,
        recipient_id=msg_data.recipient_id,
        text=msg_data.text
    )
    return msg_repo.create(new_msg)

@router.get("/messages/{recipient_id}", response_model=List[MessageResponse])
def get_messages(recipient_id: str, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    msg_repo = MessageRepository(db)
    messages = msg_repo.get_chat_history(current_user.id, recipient_id)

    # Mark messages as read where current user is the recipient
    updated_any = False
    for m in messages:
        if m.recipient_id == current_user.id and not m.is_read:
            m.is_read = True
            updated_any = True
    if updated_any:
        db.commit()

    return messages

@router.get("/messages/contacts/recent", response_model=List[str])
def get_recent_contacts(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    msg_repo = MessageRepository(db)
    return msg_repo.get_recent_contacts(current_user.id)
