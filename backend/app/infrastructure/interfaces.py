from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.models import DBUser, DBProfile, DBService, DBCategory, DBOrder, DBWallet, DBTransaction, DBMessage, DBReview, DBReport, DBAuditLog

class IUserRepository(ABC):
    @abstractmethod
    def create(self, user: DBUser) -> DBUser: pass
    @abstractmethod
    def get_by_id(self, user_id: str) -> Optional[DBUser]: pass
    @abstractmethod
    def get_by_username(self, username: str) -> Optional[DBUser]: pass
    @abstractmethod
    def update(self, user: DBUser) -> DBUser: pass
    @abstractmethod
    def get_all(self) -> List[DBUser]: pass

class IProfileRepository(ABC):
    @abstractmethod
    def create(self, profile: DBProfile) -> DBProfile: pass
    @abstractmethod
    def get_by_user_id(self, user_id: str) -> Optional[DBProfile]: pass
    @abstractmethod
    def update(self, profile: DBProfile) -> DBProfile: pass

class IServiceRepository(ABC):
    @abstractmethod
    def create(self, service: DBService) -> DBService: pass
    @abstractmethod
    def get_by_id(self, service_id: str) -> Optional[DBService]: pass
    @abstractmethod
    def update(self, service: DBService) -> DBService: pass
    @abstractmethod
    def delete(self, service_id: str) -> bool: pass
    @abstractmethod
    def search(self, query: Optional[str] = None, category_id: Optional[str] = None,
               min_price: Optional[float] = None, max_price: Optional[float] = None,
               sort_by: Optional[str] = None) -> List[DBService]: pass

class ICategoryRepository(ABC):
    @abstractmethod
    def create(self, category: DBCategory) -> DBCategory: pass
    @abstractmethod
    def get_all(self) -> List[DBCategory]: pass
    @abstractmethod
    def get_by_id(self, category_id: str) -> Optional[DBCategory]: pass

class IOrderRepository(ABC):
    @abstractmethod
    def create(self, order: DBOrder) -> DBOrder: pass
    @abstractmethod
    def get_by_id(self, order_id: str) -> Optional[DBOrder]: pass
    @abstractmethod
    def update(self, order: DBOrder) -> DBOrder: pass
    @abstractmethod
    def get_by_client_id(self, client_id: str) -> List[DBOrder]: pass
    @abstractmethod
    def get_by_provider_id(self, provider_id: str) -> List[DBOrder]: pass
    @abstractmethod
    def get_all(self) -> List[DBOrder]: pass

class IWalletRepository(ABC):
    @abstractmethod
    def create(self, wallet: DBWallet) -> DBWallet: pass
    @abstractmethod
    def get_by_user_id(self, user_id: str) -> Optional[DBWallet]: pass
    @abstractmethod
    def update(self, wallet: DBWallet) -> DBWallet: pass
    @abstractmethod
    def create_transaction(self, transaction: DBTransaction) -> DBTransaction: pass
    @abstractmethod
    def get_transactions_by_wallet_id(self, wallet_id: str) -> List[DBTransaction]: pass

class IMessageRepository(ABC):
    @abstractmethod
    def create(self, message: DBMessage) -> DBMessage: pass
    @abstractmethod
    def get_chat_history(self, user1: str, user2: str) -> List[DBMessage]: pass
    @abstractmethod
    def get_recent_contacts(self, user_id: str) -> List[str]: pass

class IReviewRepository(ABC):
    @abstractmethod
    def create(self, review: DBReview) -> DBReview: pass
    @abstractmethod
    def get_by_order_id(self, order_id: str) -> Optional[DBReview]: pass
    @abstractmethod
    def get_by_reviewee_id(self, reviewee_id: str) -> List[DBReview]: pass

class IReportRepository(ABC):
    @abstractmethod
    def create(self, report: DBReport) -> DBReport: pass
    @abstractmethod
    def get_all(self) -> List[DBReport]: pass
    @abstractmethod
    def get_by_id(self, report_id: str) -> Optional[DBReport]: pass
    @abstractmethod
    def update(self, report: DBReport) -> DBReport: pass

class IAuditLogRepository(ABC):
    @abstractmethod
    def create(self, log: DBAuditLog) -> DBAuditLog: pass
    @abstractmethod
    def get_all(self) -> List[DBAuditLog]: pass
