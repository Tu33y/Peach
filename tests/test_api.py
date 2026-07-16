import pytest

def test_health_and_readiness_endpoints(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

    response = client.get("/ready")
    assert response.status_code == 200
    assert "status" in response.json()

def test_user_registration_and_login(client):
    # Register client
    reg_response = client.post("/api/v1/auth/register", json={
        "username": "test_client",
        "password": "TestPassword123!",
        "role": "client"
    })
    assert reg_response.status_code == 200
    assert reg_response.json()["username"] == "test_client"

    # Register provider
    reg_prov_response = client.post("/api/v1/auth/register", json={
        "username": "test_provider",
        "password": "TestPassword123!",
        "role": "provider"
    })
    assert reg_prov_response.status_code == 200

    # Login
    login_response = client.post("/api/v1/auth/login", json={
        "username": "test_client",
        "password": "TestPassword123!"
    })
    assert login_response.status_code == 200
    assert "access_token" in login_response.json()

def test_wallet_deposit_and_escrow_ledger(client):
    # 1. Register users
    client.post("/api/v1/auth/register", json={
        "username": "user_buyer",
        "password": "BuyerPassword123!",
        "role": "client"
    })
    client.post("/api/v1/auth/register", json={
        "username": "user_seller",
        "password": "SellerPassword123!",
        "role": "provider"
    })

    # 2. Login buyer
    buyer_login = client.post("/api/v1/auth/login", json={
        "username": "user_buyer",
        "password": "BuyerPassword123!"
    })
    token = buyer_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Check wallet - should start with 1000 default balance
    wallet_resp = client.get("/api/v1/wallet/me", headers=headers)
    assert wallet_resp.status_code == 200
    assert wallet_resp.json()["balance"] == 1000.0

    # 4. Deposit funds
    deposit_resp = client.post("/api/v1/wallet/deposit?amount=250", headers=headers)
    assert deposit_resp.status_code == 200
    assert deposit_resp.json()["balance"] == 1250.0

    # 5. Check ledger immutability
    tx_resp = client.get("/api/v1/wallet/transactions", headers=headers)
    assert len(tx_resp.json()) == 1
    assert tx_resp.json()[0]["type"] == "deposit"
    assert tx_resp.json()[0]["amount"] == 250.0
