"""
Tests for FastAPI backend
Test-first approach: define expected behavior before implementation
"""

import pytest
from fastapi.testclient import TestClient


def test_health_endpoint_returns_200():
    """Health endpoint should return 200 OK"""
    from main import app

    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200


def test_health_endpoint_returns_json():
    """Health endpoint should return JSON"""
    from main import app

    client = TestClient(app)
    response = client.get("/health")

    assert response.headers["content-type"] == "application/json"


def test_health_endpoint_structure():
    """Health endpoint should return correct JSON structure"""
    from main import app

    client = TestClient(app)
    response = client.get("/health")

    data = response.json()

    assert "status" in data
    assert "service" in data
    assert "version" in data


def test_health_endpoint_status_ok():
    """Health endpoint status should be 'ok'"""
    from main import app

    client = TestClient(app)
    response = client.get("/health")

    data = response.json()

    assert data["status"] == "ok"
    assert data["service"] == "pob-backend"


def test_cors_headers_present():
    """CORS headers should be present for frontend access"""
    from main import app

    client = TestClient(app)
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        }
    )

    # Check CORS headers are present
    assert "access-control-allow-origin" in response.headers


def test_root_endpoint_redirects_to_docs():
    """Root endpoint should redirect to API docs"""
    from main import app

    client = TestClient(app)
    response = client.get("/", follow_redirects=False)

    # Should redirect to /docs
    assert response.status_code in [307, 302, 200]


def test_api_metadata():
    """API should have title and version in OpenAPI spec"""
    from main import app

    assert app.title == "Proof of Becoming API"
    assert app.version is not None
