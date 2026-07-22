from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from app.infrastructure.database import get_db
from app.infrastructure.repositories import MessageRepository, UserRepository
from app.domain.models import DBMessage, DBUser, DBChat, DBReport
from app.presentation.schemas import MessageCreate, MessageResponse, ChatResponse
from app.presentation.auth_router import get_current_user, decode_jwt_token
from app.infrastructure.redis_client import redis_client
from datetime import datetime
import json

router = APIRouter(tags=["Chat & Messages"])

# Active WebSocket connections dictionary: {chat_id: [WebSocket]}
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, chat_id: str):
        await websocket.accept()
        if chat_id not in self.active_connections:
            self.active_connections[chat_id] = []
        self.active_connections[chat_id].append(websocket)

    def disconnect(self, websocket: WebSocket, chat_id: str):
        if chat_id in self.active_connections:
            if websocket in self.active_connections[chat_id]:
                self.active_connections[chat_id].remove(websocket)
            if not self.active_connections[chat_id]:
                del self.active_connections[chat_id]

    async def broadcast(self, message: dict, chat_id: str):
        if chat_id in self.active_connections:
            for connection in self.active_connections[chat_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()


@router.post("/chat/create-chat", response_model=ChatResponse)
def create_chat(
    recipient_id: str,
    booking_id: Optional[str] = None,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if a chat already exists between these users
    chat = db.query(DBChat).filter(
        ((DBChat.user1 == current_user.id) & (DBChat.user2 == recipient_id)) |
        ((DBChat.user1 == recipient_id) & (DBChat.user2 == current_user.id))
    ).first()

    if not chat:
        chat = DBChat(
            user1=current_user.id,
            user2=recipient_id,
            booking_id=booking_id
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)

    return chat


@router.get("/chat/me", response_model=List[ChatResponse])
def get_my_chats(
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chats = db.query(DBChat).filter(
        (DBChat.user1 == current_user.id) | (DBChat.user2 == current_user.id)
    ).all()
    return chats


@router.get("/chat/{chat_id}/messages", response_model=List[MessageResponse])
def get_chat_messages(
    chat_id: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chat = db.query(DBChat).filter(DBChat.id == chat_id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    if chat.user1 != current_user.id and chat.user2 != current_user.id:
        raise HTTPException(status_code=403, detail="Forbidden: You are not in this chat")

    messages = db.query(DBMessage).filter(DBMessage.chat_id == chat_id).order_by(DBMessage.created_at.asc()).all()

    # Update unread messages where current user is recipient
    for m in messages:
        if m.recipient_id == current_user.id and not m.is_read:
            m.is_read = True
            m.read_at = datetime.utcnow()
    db.commit()

    return messages


@router.post("/chat/block/{user_id}")
def block_user(
    user_id: str,
    current_user: DBUser = Depends(get_current_user)
):
    # Store block relationship in Redis
    redis_client.sadd(f"block_list:{current_user.id}", user_id)
    return {"status": "success", "detail": f"User {user_id} blocked successfully"}


@router.post("/chat/unblock/{user_id}")
def unblock_user(
    user_id: str,
    current_user: DBUser = Depends(get_current_user)
):
    redis_client.srem(f"block_list:{current_user.id}", user_id)
    return {"status": "success", "detail": f"User {user_id} unblocked successfully"}


@router.post("/chat/report/{message_id}")
def report_message(
    message_id: str,
    reason: str,
    current_user: DBUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    msg = db.query(DBMessage).filter(DBMessage.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")

    report = DBReport(
        reporter_id=current_user.id,
        reported_user_id=msg.sender_id,
        reason=f"Message Report: '{msg.text}'. Reason: {reason}",
        status="pending"
    )
    db.add(report)
    db.commit()
    return {"status": "success", "detail": "Message reported to moderators successfully"}


# WEBSOCKET REAL-TIME ENDPOINT
@router.websocket("/chat/ws/{chat_id}")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    chat_id: str,
    token: str, # passed as query parameter for WS auth
    db: Session = Depends(get_db)
):
    # Perform token authentication manually
    payload = decode_jwt_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    user_id = payload.get("sub")
    user = db.query(DBUser).filter(DBUser.id == user_id).first()
    if not user or user.status == "suspended":
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify user belongs to chat
    chat = db.query(DBChat).filter(DBChat.id == chat_id).first()
    if not chat or (chat.user1 != user_id and chat.user2 != user_id):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, chat_id)

    recipient_id = chat.user2 if chat.user1 == user_id else chat.user1

    try:
        while True:
            # Receive text/json from client
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)

            # Check block list in Redis first!
            if redis_client.sismember(f"block_list:{recipient_id}", user_id):
                # Silently ignore or send block error
                await websocket.send_json({"type": "error", "content": "You are blocked by this user"})
                continue

            event_type = data.get("type", "message")

            if event_type == "typing":
                # Broadcast typing indicator to other users
                await manager.broadcast({
                    "type": "typing",
                    "sender_id": user_id,
                    "is_typing": data.get("is_typing", True)
                }, chat_id)

            elif event_type == "read_receipt":
                # Update read status of messages in this chat
                unread_msgs = db.query(DBMessage).filter(
                    DBMessage.chat_id == chat_id,
                    DBMessage.recipient_id == user_id,
                    DBMessage.is_read == False
                ).all()
                for m in unread_msgs:
                    m.is_read = True
                    m.read_at = datetime.utcnow()
                db.commit()

                await manager.broadcast({
                    "type": "read_receipt",
                    "reader_id": user_id
                }, chat_id)

            elif event_type == "message":
                text = data.get("text", "")
                attachment = data.get("attachment", None)

                # Save message to database
                new_msg = DBMessage(
                    chat_id=chat_id,
                    sender_id=user_id,
                    recipient_id=recipient_id,
                    text=text,
                    attachment=attachment,
                    is_read=False,
                    sent_at=datetime.utcnow()
                )
                db.add(new_msg)

                # Check and set first response time for reputation calculations
                # Let's see if this is the provider responding to a customer's message
                first_msg = db.query(DBMessage).filter(
                    DBMessage.chat_id == chat_id,
                    DBMessage.sender_id == recipient_id,
                    DBMessage.recipient_id == user_id
                ).order_by(DBMessage.created_at.asc()).first()
                if first_msg and not first_msg.first_response_at:
                    first_msg.first_response_at = datetime.utcnow()

                db.commit()
                db.refresh(new_msg)

                # Broadcast new message to the chat
                await manager.broadcast({
                    "type": "message",
                    "message": {
                        "id": new_msg.id,
                        "chat_id": new_msg.chat_id,
                        "sender_id": new_msg.sender_id,
                        "recipient_id": new_msg.recipient_id,
                        "text": new_msg.text,
                        "attachment": new_msg.attachment,
                        "is_read": new_msg.is_read,
                        "created_at": new_msg.created_at.isoformat()
                    }
                }, chat_id)

    except WebSocketDisconnect:
        manager.disconnect(websocket, chat_id)
    except Exception:
        manager.disconnect(websocket, chat_id)
