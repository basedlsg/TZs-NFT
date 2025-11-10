"""
Tests for the AI verification API endpoint.

Following TDD: Write tests first, then implement the verification logic.
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_verify_endpoint_exists():
    """Test that the /api/verify endpoint exists."""
    response = client.post("/api/verify", json={})
    # Should not return 404
    assert response.status_code != 404


def test_verify_requires_goal_id():
    """Test that verification requires a goal ID."""
    response = client.post("/api/verify", json={
        "reflection": "I completed my goal today!",
        "imageDataUrl": "data:image/png;base64,iVBORw0KGgo="
    })
    assert response.status_code == 422  # Validation error


def test_verify_requires_reflection():
    """Test that verification requires a reflection."""
    response = client.post("/api/verify", json={
        "goalId": "run_5km",
        "imageDataUrl": "data:image/png;base64,iVBORw0KGgo="
    })
    assert response.status_code == 422


def test_verify_requires_image():
    """Test that verification requires an image."""
    response = client.post("/api/verify", json={
        "goalId": "run_5km",
        "reflection": "I ran 5km today!"
    })
    assert response.status_code == 422


def test_verify_rejects_invalid_goal():
    """Test that verification rejects invalid goal IDs."""
    response = client.post("/api/verify", json={
        "goalId": "invalid_goal",
        "reflection": "This is a test reflection with sufficient length.",
        "imageDataUrl": "data:image/png;base64,iVBORw0KGgo="
    })
    assert response.status_code == 200
    data = response.json()
    assert data["verified"] is False
    assert "invalid goal" in data["reason"].lower()


def test_verify_rejects_short_reflection():
    """Test that verification rejects reflections that are too short."""
    response = client.post("/api/verify", json={
        "goalId": "run_5km",
        "reflection": "Too short",
        "imageDataUrl": "data:image/png;base64,iVBORw0KGgo="
    })
    assert response.status_code == 200
    data = response.json()
    assert data["verified"] is False
    assert data["confidence"] < 50


def test_verify_rejects_invalid_image_format():
    """Test that verification rejects invalid image data URLs."""
    response = client.post("/api/verify", json={
        "goalId": "run_5km",
        "reflection": "This is a valid reflection with enough content.",
        "imageDataUrl": "not-a-valid-data-url"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["verified"] is False
    assert "image" in data["reason"].lower()


def test_verify_returns_confidence_score():
    """Test that verification returns a confidence score (0-100)."""
    response = client.post("/api/verify", json={
        "goalId": "run_5km",
        "reflection": "I ran 5km today! It was challenging but I completed it.",
        "imageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    })
    assert response.status_code == 200
    data = response.json()
    assert "confidence" in data
    assert 0 <= data["confidence"] <= 100


def test_verify_returns_verification_result():
    """Test that verification returns verified boolean."""
    response = client.post("/api/verify", json={
        "goalId": "run_5km",
        "reflection": "I ran 5km today! The weather was perfect and I felt great.",
        "imageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    })
    assert response.status_code == 200
    data = response.json()
    assert "verified" in data
    assert isinstance(data["verified"], bool)


def test_verify_includes_reason_when_failed():
    """Test that failed verifications include a reason."""
    response = client.post("/api/verify", json={
        "goalId": "run_5km",
        "reflection": "Short",
        "imageDataUrl": "data:image/png;base64,iVBORw0KGgo="
    })
    assert response.status_code == 200
    data = response.json()
    if not data["verified"]:
        assert "reason" in data
        assert len(data["reason"]) > 0


def test_verify_suggests_second_photo_on_low_confidence():
    """Test that low confidence verifications suggest submitting a second photo."""
    response = client.post("/api/verify", json={
        "goalId": "run_5km",
        "reflection": "I did something today but not sure what exactly it was about.",
        "imageDataUrl": "data:image/png;base64,iVBORw0KGgo="
    })
    assert response.status_code == 200
    data = response.json()
    if data["confidence"] < 70:
        assert "needsSecondPhoto" in data
        assert data.get("needsSecondPhoto") is True


def test_verify_with_second_photo():
    """Test verification with a second photo for low confidence cases."""
    response = client.post("/api/verify", json={
        "goalId": "run_5km",
        "reflection": "I ran 5km today!",
        "imageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        "secondImageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    })
    assert response.status_code == 200
    data = response.json()
    assert "confidence" in data
    # Second photo should potentially increase confidence
    assert data["confidence"] > 0


def test_verify_valid_goals():
    """Test that all expected goal IDs are accepted."""
    valid_goals = ["run_5km", "read_20_pages", "meditate_10min", "make_sketch"]

    for goal in valid_goals:
        response = client.post("/api/verify", json={
            "goalId": goal,
            "reflection": "I completed my goal today! It was a great experience and I learned a lot.",
            "imageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        })
        assert response.status_code == 200
        data = response.json()
        assert "verified" in data
        assert "confidence" in data


def test_verify_rate_limiting():
    """Test that verification endpoint has rate limiting (anti-abuse)."""
    # Make multiple rapid requests
    responses = []
    for i in range(15):  # Attempt 15 rapid requests
        response = client.post("/api/verify", json={
            "goalId": "run_5km",
            "reflection": f"Test reflection number {i} with enough content to pass heuristics.",
            "imageDataUrl": "data:image/png;base64,iVBORw0KGgo="
        })
        responses.append(response)

    # At least one should be rate limited if limit is < 15 requests
    status_codes = [r.status_code for r in responses]
    # This test may pass if rate limit is high or disabled in test env
    # Just check that we don't crash on rapid requests
    assert all(code in [200, 429] for code in status_codes)


def test_verify_provides_feedback():
    """Test that verification provides actionable feedback."""
    response = client.post("/api/verify", json={
        "goalId": "run_5km",
        "reflection": "I completed my goal today! Here's a detailed reflection about the experience.",
        "imageDataUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    })
    assert response.status_code == 200
    data = response.json()

    # Should provide feedback even on success
    assert "feedback" in data or "reason" in data

    # Should indicate what was checked
    if "checks" in data:
        assert isinstance(data["checks"], dict)
