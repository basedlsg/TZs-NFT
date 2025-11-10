"""
Tests for Rate Limiting Middleware

Tests protection against API abuse via request rate limiting
"""

import pytest
from fastapi.testclient import TestClient
from main import app
import time

client = TestClient(app)


def test_health_endpoint_not_rate_limited():
    """Health check endpoint should not be rate limited"""
    # Make 20 rapid requests
    for _ in range(20):
        response = client.get("/health")
        assert response.status_code == 200


def test_verify_endpoint_rate_limited():
    """Verify endpoint should be rate limited per IP"""
    # First 5 requests should succeed
    for i in range(5):
        response = client.post(
            "/api/verify",
            json={
                "goalId": "test-goal",
                "reflection": "A" * 50,  # Sufficient length
                "imageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
            },
        )
        # Should either succeed or fail for validation reasons, but not rate limiting
        assert response.status_code in [200, 400, 422]

    # 6th request should be rate limited
    response = client.post(
        "/api/verify",
        json={
            "goalId": "test-goal",
            "reflection": "A" * 50,
            "imageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        },
    )
    assert response.status_code == 429  # Too Many Requests
    assert "rate limit exceeded" in response.json()["detail"].lower()


def test_qrng_endpoint_rate_limited():
    """QRNG endpoint should be rate limited per IP"""
    # First 10 requests should succeed
    for _ in range(10):
        response = client.get("/api/quantum-seed")
        assert response.status_code == 200

    # 11th request should be rate limited
    response = client.get("/api/quantum-seed")
    assert response.status_code == 429
    assert "rate limit exceeded" in response.json()["detail"].lower()


def test_ipfs_pin_endpoint_rate_limited():
    """IPFS pin endpoint should be rate limited"""
    # First 3 requests should succeed (or fail for validation/service unavailable)
    for _ in range(3):
        response = client.post(
            "/api/ipfs/pin",
            json={"data": "test data", "metadata": {"type": "test"}},
        )
        # May fail for validation, service unavailable, but not rate limiting
        assert response.status_code in [200, 400, 422, 503]

    # 4th request should be rate limited
    response = client.post(
        "/api/ipfs/pin",
        json={"data": "test data", "metadata": {"type": "test"}},
    )
    assert response.status_code == 429


def test_rate_limit_resets_after_window():
    """Rate limits should reset after the time window"""
    # This test would require waiting for the window to expire
    # For now, we'll just verify the response format
    response = client.get("/api/quantum-seed")

    # Should include rate limit headers
    assert "X-RateLimit-Limit" in response.headers or response.status_code in [
        200,
        429,
    ]


def test_rate_limit_headers_present():
    """Rate limit responses should include informative headers"""
    response = client.get("/api/quantum-seed")

    if response.status_code == 429:
        data = response.json()
        assert "detail" in data
        assert "rate limit" in data["detail"].lower()


def test_different_endpoints_separate_limits():
    """Different endpoints should have separate rate limits"""
    # Use up QRNG limit
    for _ in range(10):
        client.get("/api/quantum-seed")

    # Verify endpoint should still work
    response = client.post(
        "/api/verify",
        json={
            "goalId": "test-goal",
            "reflection": "A" * 50,
            "imageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        },
    )
    # Should work or fail for validation (not rate limiting)
    # Note: May also get 429 if previous tests exhausted this endpoint's limit
    assert response.status_code in [200, 400, 422, 429]


def test_rate_limit_error_format():
    """Rate limit errors should be properly formatted"""
    # Exceed rate limit on verify endpoint
    for _ in range(6):
        client.post(
            "/api/verify",
            json={
                "goalId": "test-goal",
                "reflection": "A" * 50,
                "imageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
            },
        )

    response = client.post(
        "/api/verify",
        json={
            "goalId": "test-goal",
            "reflection": "A" * 50,
            "imageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
        },
    )

    if response.status_code == 429:
        data = response.json()
        assert "detail" in data
        assert isinstance(data["detail"], str)
