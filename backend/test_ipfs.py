"""
Tests for IPFS integration endpoints
Test-first approach for IPFS pinning/retrieval
"""

import pytest
from fastapi.testclient import TestClient
from main import app
import base64


client = TestClient(app)


def test_pin_endpoint_exists():
    """POST /api/ipfs/pin endpoint should exist"""
    response = client.post(
        "/api/ipfs/pin",
        json={"data": "test"}
    )

    # Should not return 404
    assert response.status_code != 404


def test_pin_requires_data():
    """Pin endpoint should require data field"""
    response = client.post("/api/ipfs/pin", json={})

    assert response.status_code == 422  # Validation error


def test_pin_accepts_encrypted_data():
    """Pin endpoint should accept encrypted data (base64 string)"""
    # Simulate encrypted data (IV:ciphertext format, base64 encoded)
    encrypted_data = base64.b64encode(b"fake-iv:fake-ciphertext").decode()

    response = client.post(
        "/api/ipfs/pin",
        json={"data": encrypted_data}
    )

    # Should accept the request (may fail if IPFS not configured, that's OK)
    assert response.status_code in [200, 503]  # 503 if IPFS unavailable


def test_pin_returns_ipfs_hash():
    """Successful pin should return IPFS CID"""
    encrypted_data = base64.b64encode(b"test-encrypted-data").decode()

    response = client.post(
        "/api/ipfs/pin",
        json={"data": encrypted_data}
    )

    if response.status_code == 200:
        data = response.json()
        assert "cid" in data
        assert "uri" in data
        assert data["uri"].startswith("ipfs://")


def test_pin_validates_data_size():
    """Pin endpoint should reject data larger than max size"""
    # Create large data (>10MB)
    large_data = "a" * (11 * 1024 * 1024)  # 11MB
    encrypted_data = base64.b64encode(large_data.encode()).decode()

    response = client.post(
        "/api/ipfs/pin",
        json={"data": encrypted_data}
    )

    assert response.status_code == 413  # Payload too large


def test_retrieve_endpoint_exists():
    """GET /api/ipfs/{cid} endpoint should exist"""
    response = client.get("/api/ipfs/QmTest123")

    # Should not return 404 (may return 503 if IPFS unavailable)
    assert response.status_code != 404


def test_retrieve_returns_data():
    """Retrieve endpoint should return pinned data"""
    # This test requires actual IPFS pin, skip if not available
    test_cid = "QmTest123"

    response = client.get(f"/api/ipfs/{test_cid}")

    # 200 if found, 404 if not found, 503 if IPFS unavailable
    assert response.status_code in [200, 404, 503]

    if response.status_code == 200:
        data = response.json()
        assert "data" in data


def test_pin_metadata_optional():
    """Pin endpoint should accept optional metadata"""
    encrypted_data = base64.b64encode(b"test-data").decode()

    response = client.post(
        "/api/ipfs/pin",
        json={
            "data": encrypted_data,
            "metadata": {
                "goal_id": "run_5km",
                "timestamp": 1699999999
            }
        }
    )

    # Should accept metadata
    assert response.status_code in [200, 503]


def test_ipfs_health_check():
    """Health endpoint should indicate IPFS status"""
    response = client.get("/api/ipfs/health")

    assert response.status_code == 200
    data = response.json()

    assert "ipfs_available" in data
    assert isinstance(data["ipfs_available"], bool)
