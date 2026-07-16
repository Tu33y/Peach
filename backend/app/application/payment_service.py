import uuid
from typing import List, Optional
from datetime import datetime
from app.domain.models import DBOrder, DBTransaction, DBWallet
from app.infrastructure.interfaces import IWalletRepository, IOrderRepository

class PaymentService:
    def __init__(self, wallet_repo: IWalletRepository, order_repo: IOrderRepository):
        self.wallet_repo = wallet_repo
        self.order_repo = order_repo

    def create_wallet(self, user_id: str) -> DBWallet:
        wallet = DBWallet(user_id=user_id, balance=1000.0, escrow_balance=0.0)
        return self.wallet_repo.create(wallet)

    def lock_funds_to_escrow(self, order: DBOrder) -> bool:
        client_wallet = self.wallet_repo.get_by_user_id(order.client_id)
        if not client_wallet or client_wallet.balance < order.price:
            return False

        balance_before = client_wallet.balance
        client_wallet.balance -= order.price
        client_wallet.escrow_balance += order.price
        self.wallet_repo.update(client_wallet)

        txn = DBTransaction(
            wallet_id=client_wallet.id,
            order_id=order.id,
            amount=order.price,
            type="escrow_lock",
            balance_before=balance_before,
            balance_after=client_wallet.balance,
            status="completed"
        )
        self.wallet_repo.create_transaction(txn)
        return True

    def release_funds_from_escrow(self, order: DBOrder) -> bool:
        client_wallet = self.wallet_repo.get_by_user_id(order.client_id)
        provider_wallet = self.wallet_repo.get_by_user_id(order.provider_id)

        if not client_wallet or not provider_wallet or client_wallet.escrow_balance < order.price:
            return False

        client_before = client_wallet.balance
        client_wallet.escrow_balance -= order.price
        self.wallet_repo.update(client_wallet)

        client_txn = DBTransaction(
            wallet_id=client_wallet.id,
            order_id=order.id,
            amount=order.price,
            type="escrow_release",
            balance_before=client_before,
            balance_after=client_wallet.balance,
            status="completed"
        )
        self.wallet_repo.create_transaction(client_txn)

        fee_amount = order.platform_fee
        provider_amount = order.price - fee_amount

        provider_before = provider_wallet.balance
        provider_wallet.balance += provider_amount
        self.wallet_repo.update(provider_wallet)

        provider_txn = DBTransaction(
            wallet_id=provider_wallet.id,
            order_id=order.id,
            amount=provider_amount,
            type="escrow_release",
            balance_before=provider_before,
            balance_after=provider_wallet.balance,
            status="completed"
        )
        self.wallet_repo.create_transaction(provider_txn)
        return True

    def refund_funds_from_escrow(self, order: DBOrder) -> bool:
        client_wallet = self.wallet_repo.get_by_user_id(order.client_id)
        if not client_wallet or client_wallet.escrow_balance < order.price:
            return False

        client_before = client_wallet.balance
        client_wallet.escrow_balance -= order.price
        client_wallet.balance += order.price
        self.wallet_repo.update(client_wallet)

        txn = DBTransaction(
            wallet_id=client_wallet.id,
            order_id=order.id,
            amount=order.price,
            type="refund",
            balance_before=client_before,
            balance_after=client_wallet.balance,
            status="completed"
        )
        self.wallet_repo.create_transaction(txn)
        return True
