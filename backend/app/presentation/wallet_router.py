from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.infrastructure.database import get_db
from app.infrastructure.repositories import WalletRepository, OrderRepository
from app.domain.models import DBUser, DBWallet, DBTransaction
from app.presentation.schemas import WalletResponse, TransactionResponse
from app.presentation.auth_router import get_current_user

router = APIRouter(prefix="/wallet", tags=["Wallet & Ledger"])

@router.get("/me", response_model=WalletResponse)
def get_my_wallet(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet_repo = WalletRepository(db)
    wallet = wallet_repo.get_by_user_id(current_user.id)
    if not wallet:
        # Create wallet if it does not exist
        wallet = DBWallet(user_id=current_user.id, balance=1000.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
    return wallet

@router.get("/transactions", response_model=List[TransactionResponse])
def get_my_transactions(current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    wallet_repo = WalletRepository(db)
    wallet = wallet_repo.get_by_user_id(current_user.id)
    if not wallet:
        return []
    return wallet_repo.get_transactions_by_wallet_id(wallet.id)

@router.post("/deposit", response_model=WalletResponse)
def deposit_funds(amount: float, current_user: DBUser = Depends(get_current_user), db: Session = Depends(get_db)):
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")

    wallet_repo = WalletRepository(db)
    wallet = wallet_repo.get_by_user_id(current_user.id)
    if not wallet:
        wallet = DBWallet(user_id=current_user.id, balance=0.0)
        db.add(wallet)
        db.commit()
        db.refresh(wallet)

    balance_before = wallet.balance
    wallet.balance += amount
    wallet_repo.update(wallet)

    # Immutable transaction ledger
    txn = DBTransaction(
        wallet_id=wallet.id,
        amount=amount,
        type="deposit",
        balance_before=balance_before,
        balance_after=wallet.balance,
        status="completed"
    )
    wallet_repo.create_transaction(txn)
    return wallet
