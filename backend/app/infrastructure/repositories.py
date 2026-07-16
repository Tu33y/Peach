from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.domain.models import DBUser, DBProfile, DBService, DBCategory, DBOrder, DBWallet, DBTransaction, DBMessage, DBReview, DBReport, DBAuditLog
from app.infrastructure.interfaces import (
    IUserRepository, IProfileRepository, IServiceRepository, ICategoryRepository,
    IOrderRepository, IWalletRepository, IMessageRepository, IReviewRepository,
    IReportRepository, IAuditLogRepository
)

class UserRepository(IUserRepository):
    def __init__(self, db: Session):
        self.db = db

    def create(self, user: DBUser) -> DBUser:
        self.db.add(user)
        self.db.flush()
        return user

    def get_by_id(self, user_id: str) -> Optional[DBUser]:
        return self.db.query(DBUser).filter(DBUser.id == user_id).first()

    def get_by_username(self, username: str) -> Optional[DBUser]:
        return self.db.query(DBUser).filter(DBUser.username == username).first()

    def update(self, user: DBUser) -> DBUser:
        self.db.flush()
        return user

    def get_all(self) -> List[DBUser]:
        return self.db.query(DBUser).all()


class ProfileRepository(IProfileRepository):
    def __init__(self, db: Session):
        self.db = db

    def create(self, profile: DBProfile) -> DBProfile:
        self.db.add(profile)
        self.db.flush()
        return profile

    def get_by_user_id(self, user_id: str) -> Optional[DBProfile]:
        return self.db.query(DBProfile).filter(DBProfile.user_id == user_id).first()

    def update(self, profile: DBProfile) -> DBProfile:
        self.db.flush()
        return profile


class CategoryRepository(ICategoryRepository):
    def __init__(self, db: Session):
        self.db = db

    def create(self, category: DBCategory) -> DBCategory:
        self.db.add(category)
        self.db.flush()
        return category

    def get_all(self) -> List[DBCategory]:
        return self.db.query(DBCategory).all()

    def get_by_id(self, category_id: str) -> Optional[DBCategory]:
        return self.db.query(DBCategory).filter(DBCategory.id == category_id).first()


class ServiceRepository(IServiceRepository):
    def __init__(self, db: Session):
        self.db = db

    def create(self, service: DBService) -> DBService:
        self.db.add(service)
        self.db.flush()
        return service

    def get_by_id(self, service_id: str) -> Optional[DBService]:
        return self.db.query(DBService).filter(DBService.id == service_id).first()

    def update(self, service: DBService) -> DBService:
        self.db.flush()
        return service

    def delete(self, service_id: str) -> bool:
        service = self.get_by_id(service_id)
        if service:
            self.db.delete(service)
            self.db.flush()
            return True
        return False

    def search(self, query: Optional[str] = None, category_id: Optional[str] = None,
               min_price: Optional[float] = None, max_price: Optional[float] = None,
               sort_by: Optional[str] = None) -> List[DBService]:
        q = self.db.query(DBService)
        if query:
            q = q.filter(or_(DBService.title.ilike(f"%{query}%"), DBService.description.ilike(f"%{query}%")))
        if category_id:
            q = q.filter(DBService.category_id == category_id)
        if min_price is not None:
            q = q.filter(DBService.price >= min_price)
        if max_price is not None:
            q = q.filter(DBService.price <= max_price)

        if sort_by == "price_asc":
            q = q.order_by(DBService.price.asc())
        elif sort_by == "price_desc":
            q = q.order_by(DBService.price.desc())
        else:
            q = q.order_by(DBService.created_at.desc())

        return q.all()


class OrderRepository(IOrderRepository):
    def __init__(self, db: Session):
        self.db = db

    def create(self, order: DBOrder) -> DBOrder:
        self.db.add(order)
        self.db.flush()
        return order

    def get_by_id(self, order_id: str) -> Optional[DBOrder]:
        return self.db.query(DBOrder).filter(DBOrder.id == order_id).first()

    def update(self, order: DBOrder) -> DBOrder:
        self.db.flush()
        return order

    def get_by_client_id(self, client_id: str) -> List[DBOrder]:
        return self.db.query(DBOrder).filter(DBOrder.client_id == client_id).order_by(DBOrder.created_at.desc()).all()

    def get_by_provider_id(self, provider_id: str) -> List[DBOrder]:
        return self.db.query(DBOrder).filter(DBOrder.provider_id == provider_id).order_by(DBOrder.created_at.desc()).all()

    def get_all(self) -> List[DBOrder]:
        return self.db.query(DBOrder).order_by(DBOrder.created_at.desc()).all()


class WalletRepository(IWalletRepository):
    def __init__(self, db: Session):
        self.db = db

    def create(self, wallet: DBWallet) -> DBWallet:
        self.db.add(wallet)
        self.db.flush()
        return wallet

    def get_by_user_id(self, user_id: str) -> Optional[DBWallet]:
        return self.db.query(DBWallet).filter(DBWallet.user_id == user_id).first()

    def update(self, wallet: DBWallet) -> DBWallet:
        self.db.flush()
        return wallet

    def create_transaction(self, transaction: DBTransaction) -> DBTransaction:
        self.db.add(transaction)
        self.db.flush()
        return transaction

    def get_transactions_by_wallet_id(self, wallet_id: str) -> List[DBTransaction]:
        return self.db.query(DBTransaction).filter(DBTransaction.wallet_id == wallet_id).order_by(DBTransaction.created_at.desc()).all()


class MessageRepository(IMessageRepository):
    def __init__(self, db: Session):
        self.db = db

    def create(self, message: DBMessage) -> DBMessage:
        self.db.add(message)
        self.db.flush()
        return message

    def get_chat_history(self, user1: str, user2: str) -> List[DBMessage]:
        return self.db.query(DBMessage).filter(
            or_(
                and_(DBMessage.sender_id == user1, DBMessage.recipient_id == user2),
                and_(DBMessage.sender_id == user2, DBMessage.recipient_id == user1)
            )
        ).order_by(DBMessage.created_at.asc()).all()

    def get_recent_contacts(self, user_id: str) -> List[str]:
        sent = self.db.query(DBMessage.recipient_id).filter(DBMessage.sender_id == user_id).distinct()
        received = self.db.query(DBMessage.sender_id).filter(DBMessage.recipient_id == user_id).distinct()
        contacts = set([r[0] for r in sent.all()] + [r[0] for r in received.all()])
        return list(contacts)


class ReviewRepository(IReviewRepository):
    def __init__(self, db: Session):
        self.db = db

    def create(self, review: DBReview) -> DBReview:
        self.db.add(review)
        self.db.flush()
        return review

    def get_by_order_id(self, order_id: str) -> Optional[DBReview]:
        return self.db.query(DBReview).filter(DBReview.order_id == order_id).first()

    def get_by_reviewee_id(self, reviewee_id: str) -> List[DBReview]:
        return self.db.query(DBReview).filter(DBReview.reviewee_id == reviewee_id).all()


class ReportRepository(IReportRepository):
    def __init__(self, db: Session):
        self.db = db

    def create(self, report: DBReport) -> DBReport:
        self.db.add(report)
        self.db.flush()
        return report

    def get_all(self) -> List[DBReport]:
        return self.db.query(DBReport).order_by(DBReport.created_at.desc()).all()

    def get_by_id(self, report_id: str) -> Optional[DBReport]:
        return self.db.query(DBReport).filter(DBReport.id == report_id).first()

    def update(self, report: DBReport) -> DBReport:
        self.db.flush()
        return report


class AuditLogRepository(IAuditLogRepository):
    def __init__(self, db: Session):
        self.db = db

    def create(self, log: DBAuditLog) -> DBAuditLog:
        self.db.add(log)
        self.db.flush()
        return log

    def get_all(self) -> List[DBAuditLog]:
        return self.db.query(DBAuditLog).order_by(DBAuditLog.timestamp.desc()).all()
