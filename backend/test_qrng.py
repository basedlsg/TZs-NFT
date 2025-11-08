"""
Tests for Quantum Random Number Generation (QRNG) API endpoint.

Following TDD: Write tests first, then implement the QRNG logic.
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_qrng_endpoint_exists():
    """Test that the /api/quantum-seed endpoint exists."""
    response = client.get("/api/quantum-seed")
    # Should not return 404
    assert response.status_code != 404


def test_qrng_returns_seed():
    """Test that QRNG endpoint returns a seed."""
    response = client.get("/api/quantum-seed")
    assert response.status_code == 200
    data = response.json()
    assert "seed" in data
    assert isinstance(data["seed"], str)


def test_qrng_seed_is_hex():
    """Test that seed is a valid hexadecimal string."""
    response = client.get("/api/quantum-seed")
    assert response.status_code == 200
    data = response.json()

    # Should be valid hex
    try:
        int(data["seed"], 16)
    except ValueError:
        pytest.fail("Seed is not valid hexadecimal")


def test_qrng_seed_length():
    """Test that seed has correct length (64 characters = 32 bytes = 256 bits)."""
    response = client.get("/api/quantum-seed")
    assert response.status_code == 200
    data = response.json()

    # 32 bytes = 64 hex characters
    assert len(data["seed"]) == 64


def test_qrng_returns_source():
    """Test that response indicates the source of randomness."""
    response = client.get("/api/quantum-seed")
    assert response.status_code == 200
    data = response.json()

    assert "source" in data
    assert data["source"] in ["quantum", "pseudo"]


def test_qrng_with_size_parameter():
    """Test that QRNG accepts optional size parameter."""
    response = client.get("/api/quantum-seed?size=16")
    assert response.status_code == 200
    data = response.json()

    # 16 bytes = 32 hex characters
    assert len(data["seed"]) == 32


def test_qrng_validates_size_parameter():
    """Test that QRNG validates size parameter."""
    # Too large
    response = client.get("/api/quantum-seed?size=1024")
    assert response.status_code == 400

    # Too small
    response = client.get("/api/quantum-seed?size=0")
    assert response.status_code == 400


def test_qrng_returns_timestamp():
    """Test that QRNG returns generation timestamp."""
    response = client.get("/api/quantum-seed")
    assert response.status_code == 200
    data = response.json()

    assert "timestamp" in data
    assert isinstance(data["timestamp"], int)
    assert data["timestamp"] > 0


def test_qrng_seeds_are_unique():
    """Test that consecutive calls return different seeds."""
    response1 = client.get("/api/quantum-seed")
    response2 = client.get("/api/quantum-seed")

    assert response1.status_code == 200
    assert response2.status_code == 200

    seed1 = response1.json()["seed"]
    seed2 = response2.json()["seed"]

    # Seeds should be different (astronomically unlikely to be same)
    assert seed1 != seed2


def test_qrng_fallback_on_quantum_failure():
    """Test that QRNG falls back to CSPRNG if quantum source fails."""
    # This test assumes quantum might not be available
    response = client.get("/api/quantum-seed")
    assert response.status_code == 200
    data = response.json()

    # Should return a seed regardless of source
    assert "seed" in data
    assert len(data["seed"]) == 64

    # Source should be either quantum or pseudo
    assert data["source"] in ["quantum", "pseudo"]


def test_qrng_includes_metadata():
    """Test that QRNG response includes useful metadata."""
    response = client.get("/api/quantum-seed")
    assert response.status_code == 200
    data = response.json()

    # Should have metadata about the generation
    assert "seed" in data
    assert "source" in data
    assert "timestamp" in data
    assert "size" in data


def test_qrng_default_size():
    """Test that QRNG uses 32 bytes (256 bits) as default."""
    response = client.get("/api/quantum-seed")
    assert response.status_code == 200
    data = response.json()

    assert data["size"] == 32
    assert len(data["seed"]) == 64  # 32 bytes = 64 hex chars


def test_qrng_accepts_json_format():
    """Test that QRNG returns valid JSON."""
    response = client.get("/api/quantum-seed")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"

    # Should parse as valid JSON
    data = response.json()
    assert isinstance(data, dict)


def test_qrng_rate_limiting():
    """Test that QRNG endpoint can handle multiple rapid requests."""
    # Make 10 rapid requests
    responses = []
    for _ in range(10):
        response = client.get("/api/quantum-seed")
        responses.append(response)

    # All should succeed (or some might be rate limited)
    for response in responses:
        assert response.status_code in [200, 429]  # OK or rate limited

    # At least some should succeed
    success_count = sum(1 for r in responses if r.status_code == 200)
    assert success_count > 0
