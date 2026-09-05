from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert "SecureAI Vault" in data["service"]

def test_security_headers_present():
    response = client.get("/health")
    assert "x-content-type-options" in response.headers
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"

def test_auth_login_admin():
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admin@secureai.local", "password": "Password@123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "admin@secureai.local"

def test_blockchain_verification_api():
    # Login first
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admin@secureai.local", "password": "Password@123!"}
    )
    token = login_res.json()["access_token"]
    
    verify_res = client.get(
        "/api/v1/blockchain/verify",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert verify_res.status_code == 200
    assert "is_valid" in verify_res.json()
