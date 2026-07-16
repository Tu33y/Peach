import sys
import os
from sqlalchemy.orm import Session
from app.infrastructure.database import SessionLocal, engine
from app.domain.models import DBUser, DBProfile, DBWallet, DBCategory, DBService, DBOrder, DBReview, DBMessage, DBTransaction
from app.application.auth_service import hash_password

def seed_database():
    db: Session = SessionLocal()
    try:
        # Check if database is already seeded
        if db.query(DBUser).first() is not None:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database deterministically...")

        # 1. Categories
        categories = [
            DBCategory(name="Riparazioni", description="Servizi di riparazione casa ed elettronica"),
            DBCategory(name="Lezioni", description="Lezioni private, tutoraggio e formazione"),
            DBCategory(name="Consulenze", description="Consulenza legale, fiscale e tecnica"),
            DBCategory(name="Assistenza", description="Assistenza personale, anziani, pet-sitting")
        ]
        for cat in categories:
            db.add(cat)
        db.flush() # Populate IDs

        # 2. Users
        password_h = hash_password("DemoPassword123!")

        admin_user = DBUser(username="admin", password_hash=password_h, role="admin", is_verified=True, reliability_level="professional")
        client_user = DBUser(username="client_demo", password_hash=password_h, role="client", is_verified=True, reliability_level="verified")
        provider_user1 = DBUser(username="mario_rossi", password_hash=password_h, role="provider", is_verified=True, reliability_level="reliable")
        provider_user2 = DBUser(username="giulia_verdi", password_hash=password_h, role="provider", is_verified=True, reliability_level="professional")

        users = [admin_user, client_user, provider_user1, provider_user2]
        for u in users:
            db.add(u)
        db.flush()

        # 3. Profiles & Wallets
        for u in users:
            p = DBProfile(user_id=u.id, description=f"Profilo demo per {u.username}")
            w = DBWallet(user_id=u.id, balance=1000.0 if u.role != "admin" else 50000.0)
            db.add(p)
            db.add(w)
        db.flush()

        # 4. Services
        service1 = DBService(
            provider_id=provider_user1.id,
            category_id=categories[0].id, # Riparazioni
            title="Riparazione Lavatrici ed Elettrodomestici",
            description="Esperto riparatore di elettrodomestici a domicilio. Preventivi chiari.",
            price=50.0,
            location_general="Milano, Italia",
            latitude=45.4642,
            longitude=9.1900
        )
        service2 = DBService(
            provider_id=provider_user2.id,
            category_id=categories[1].id, # Lezioni
            title="Lezioni di Matematica e Fisica Superiori",
            description="Laureata in Fisica impartisce lezioni e ripetizioni per studenti superiori ed universitari.",
            price=25.0,
            location_general="Torino, Italia",
            latitude=45.0703,
            longitude=7.6869
        )
        db.add(service1)
        db.add(service2)
        db.flush()

        # 5. Orders (Completed and reviewed order to demonstrate the trust score workflow)
        order1 = DBOrder(
            client_id=client_user.id,
            provider_id=provider_user1.id,
            service_id=service1.id,
            price=service1.price,
            platform_fee=service1.price * 0.1,
            status="completed"
        )
        db.add(order1)
        db.flush()

        # Transactions for Order 1
        txn_lock = DBTransaction(
            wallet_id=client_user.wallet.id,
            order_id=order1.id,
            amount=50.0,
            type="escrow_lock",
            balance_before=1000.0,
            balance_after=950.0
        )
        txn_release_client = DBTransaction(
            wallet_id=client_user.wallet.id,
            order_id=order1.id,
            amount=50.0,
            type="escrow_release",
            balance_before=950.0,
            balance_after=950.0
        )
        txn_receive_provider = DBTransaction(
            wallet_id=provider_user1.wallet.id,
            order_id=order1.id,
            amount=45.0,
            type="escrow_release",
            balance_before=1000.0,
            balance_after=1045.0
        )
        db.add(txn_lock)
        db.add(txn_release_client)
        db.add(txn_receive_provider)

        # Update actual balances to reflect completed transaction
        client_user.wallet.balance = 950.0
        provider_user1.wallet.balance = 1045.0

        # Review
        review1 = DBReview(
            order_id=order1.id,
            reviewer_id=client_user.id,
            reviewee_id=provider_user1.id,
            rating=5,
            comment="Ottimo lavoro, veloce ed estremamente professionale!"
        )
        db.add(review1)

        # Messages
        msg1 = DBMessage(sender_id=client_user.id, recipient_id=provider_user1.id, text="Ciao, la mia lavatrice non centrifuga. Quando potresti venire?")
        msg2 = DBMessage(sender_id=provider_user1.id, recipient_id=client_user.id, text="Ciao! Posso passare domani pomeriggio verso le 15:00. Va bene?", is_read=True)
        db.add(msg1)
        db.add(db.merge(msg2))

        db.commit()
        print("Database seeded successfully with deterministic data.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
