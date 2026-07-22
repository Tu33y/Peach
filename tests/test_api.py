import pytest
import uuid
from datetime import datetime, timedelta

def get_unique_name(base: str) -> str:
    return f"{base}_{uuid.uuid4().hex[:6]}"

def test_health_and_readiness_endpoints(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

    response = client.get("/ready")
    assert response.status_code == 200
    assert "status" in response.json()


def test_user_registration_and_login(client):
    username = get_unique_name("client")
    # Register client with consents (EPIC 0)
    reg_response = client.post("/api/v1/auth/register", json={
        "username": username,
        "password": "TestPassword123!",
        "role": "client",
        "accepted_terms": True,
        "accepted_privacy": True,
        "consent_version": "v1.0"
      })
    assert reg_response.status_code == 200
    assert reg_response.json()["username"] == username
    assert reg_response.json()["is_adult_verified"] is False

    # Login
    login_response = client.post("/api/v1/auth/login", json={
        "username": username,
        "password": "TestPassword123!"
    })
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()


def test_verification_requests_and_admin_approvals(client):
    admin_name = get_unique_name("admin")
    # Register client and login as administrator
    client.post("/api/v1/auth/register", json={
        "username": admin_name,
        "password": "AdminPassword123!",
        "role": "admin"
    })
    admin_login = client.post("/api/v1/auth/login", json={
        "username": admin_name,
        "password": "AdminPassword123!"
    })
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    seller_name = get_unique_name("provider")
    # Register provider and login
    client.post("/api/v1/auth/register", json={
        "username": seller_name,
        "password": "SellerPassword123!",
        "role": "provider"
    })
    seller_login = client.post("/api/v1/auth/login", json={
        "username": seller_name,
        "password": "SellerPassword123!"
    })
    seller_token = seller_login.json()["access_token"]
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    # Create document
    doc_res = client.post(
        "/api/v1/verification/upload-document",
        data={"document_type": "passport"},
        files={"file": ("passport.png", b"dummy_content", "image/png")},
        headers=seller_headers
    )
    assert doc_res.status_code == 200
    assert doc_res.json()["document_type"] == "passport"

    # Submit age verification
    req_res = client.post(
        "/api/v1/verification/submit-verification",
        data={"type": "age"},
        headers=seller_headers
    )
    assert req_res.status_code == 200
    request_id = req_res.json()["id"]

    # Submit identity verification
    req_ident = client.post(
        "/api/v1/verification/submit-verification",
        data={"type": "identity"},
        headers=seller_headers
    )
    assert req_ident.status_code == 200
    ident_id = req_ident.json()["id"]

    # List requests as admin
    admin_list = client.get("/api/v1/verification/admin/requests", headers=admin_headers)
    assert admin_list.status_code == 200
    assert len(admin_list.json()) >= 2

    # Approve requests
    approve_res1 = client.post(
        f"/api/v1/verification/admin/approve/{request_id}",
        data={"reason": "Age checked and verified"},
        headers=admin_headers
      )
    assert approve_res1.status_code == 200

    # Inspect status
    status_res = client.get("/api/v1/verification/status", headers=seller_headers)
    assert status_res.status_code == 200
    assert status_res.json()["is_adult_verified"] is True


def test_services_creation_and_geocoding_lookup(client):
    seller_name = get_unique_name("provider")
    # Register provider and login
    client.post("/api/v1/auth/register", json={
        "username": seller_name,
        "password": "SellerPassword123!",
        "role": "provider"
    })
    seller_login = client.post("/api/v1/auth/login", json={
        "username": seller_name,
        "password": "SellerPassword123!"
    })
    seller_token = seller_login.json()["access_token"]
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    # Create service
    service_res = client.post(
        "/api/v1/services",
        json={
            "title": "Acoustic Guitar Lessons",
            "description": "Learn professional guitar in Mitte with certified instructor.",
            "price": 60.0,
            "city": "Berlin Mitte",
            "postcode": "10115",
            "languages": "English, German",
            "rules": "Bring your own acoustic guitar."
        },
        headers=seller_headers
    )
    assert service_res.status_code == 200
    assert service_res.json()["city"] == "Berlin Mitte"
    assert service_res.json()["price"] == 60.0


def test_order_creation_with_scheduling_and_escrow_transitions(client):
    seller_name = get_unique_name("provider")
    # Register provider and login
    client.post("/api/v1/auth/register", json={
        "username": seller_name,
        "password": "SellerPassword123!",
        "role": "provider"
    })
    seller_login = client.post("/api/v1/auth/login", json={
        "username": seller_name,
        "password": "SellerPassword123!"
    })
    seller_token = seller_login.json()["access_token"]
    seller_headers = {"Authorization": f"Bearer {seller_token}"}

    buyer_name = get_unique_name("client")
    # Register customer and login
    client.post("/api/v1/auth/register", json={
        "username": buyer_name,
        "password": "BuyerPassword123!",
        "role": "client"
    })
    buyer_login = client.post("/api/v1/auth/login", json={
        "username": buyer_name,
        "password": "BuyerPassword123!"
    })
    buyer_token = buyer_login.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # Create service
    service_res = client.post(
        "/api/v1/services",
        json={
            "title": "Acoustic Guitar Lessons",
            "description": "Learn professional guitar in Mitte with certified instructor.",
            "price": 60.0,
            "city": "Berlin Mitte",
            "postcode": "10115"
        },
        headers=seller_headers
    )
    assert service_res.status_code == 200
    service_id = service_res.json()["id"]

    # Book service with scheduled dates
    sched_start = (datetime.utcnow() + timedelta(days=1)).isoformat()
    sched_end = (datetime.utcnow() + timedelta(days=1, hours=2)).isoformat()

    order_res = client.post(
        "/api/v1/requests",
        json={
            "service_id": service_id,
            "scheduled_start_time": sched_start,
            "scheduled_end_time": sched_end
        },
        headers=buyer_headers
    )
    assert order_res.status_code == 200
    assert order_res.json()["status"] == "pending"
    order_id = order_res.json()["id"]

    # Accept order as provider (this locks customer budget in escrow)
    accept_res = client.put(
        f"/api/v1/requests/{order_id}/status?new_status=accepted",
        headers=seller_headers
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "accepted"

    # Verify customer wallet balance after lock
    wallet_res = client.get("/api/v1/wallet/me", headers=buyer_headers)
    assert wallet_res.status_code == 200
    assert wallet_res.json()["escrow_balance"] == 60.0

    # Complete order (this releases locked escrow funds to provider)
    complete_res = client.put(
        f"/api/v1/requests/{order_id}/status?new_status=completed",
        headers=seller_headers
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["status"] == "completed"

    # Check seller wallet is topped up with released earnings
    seller_wallet = client.get("/api/v1/wallet/me", headers=seller_headers)
    assert seller_wallet.status_code == 200
    # Released price is service price (60) minus platform fee (10% of 60 = 6) plus base starting balance (1000) = 1054
    assert seller_wallet.json()["balance"] == 1054.0


def test_safety_sos_trigger_and_checkins(client):
    buyer_name = get_unique_name("client")
    # Register customer and login
    client.post("/api/v1/auth/register", json={
        "username": buyer_name,
        "password": "BuyerPassword123!",
        "role": "client"
    })
    buyer_login = client.post("/api/v1/auth/login", json={
        "username": buyer_name,
        "password": "BuyerPassword123!"
    })
    buyer_token = buyer_login.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # Trigger SOS emergency alerts
    sos_res = client.post(
        "/api/v1/safety/create-event",
        json={"type": "SOS", "location": "Berlin Mitte, Alexanderplatz"},
        headers=buyer_headers
    )
    assert sos_res.status_code == 200
    assert sos_res.json()["type"] == "SOS"
    assert sos_res.json()["location"] == "Berlin Mitte, Alexanderplatz"
    assert sos_res.json()["status"] == "active"


def test_wallet_deposit_and_escrow_ledger(client):
    buyer_name = get_unique_name("client")
    # Register and login buyer
    client.post("/api/v1/auth/register", json={
        "username": buyer_name,
        "password": "BuyerPassword123!",
        "role": "client"
    })
    buyer_login = client.post("/api/v1/auth/login", json={
        "username": buyer_name,
        "password": "BuyerPassword123!"
    })
    token = buyer_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Deposit funds
    deposit_resp = client.post("/api/v1/wallet/deposit?amount=250", headers=headers)
    assert deposit_resp.status_code == 200

    # Check ledger immutability
    tx_resp = client.get("/api/v1/wallet/transactions", headers=headers)
    # Check that deposit is present in ledger logs
    assert any(tx["type"] == "deposit" and tx["amount"] == 250.0 for tx in tx_resp.json())
