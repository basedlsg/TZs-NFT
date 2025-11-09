"""
End-to-End Integration Tests for Proof of Becoming Backend

Tests the complete flow from proof submission to verification
"""

import pytest
from fastapi.testclient import TestClient
from main import app
import base64
import time

client = TestClient(app)


@pytest.fixture
def valid_image_data_url():
    """Fixture providing a valid small PNG data URL"""
    # Tiny 1x1 transparent PNG
    png_data = base64.b64decode(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    )
    return f"data:image/png;base64,{base64.b64encode(png_data).decode()}"


@pytest.fixture
def valid_proof_request(valid_image_data_url):
    """Fixture providing a valid proof verification request"""
    return {
        "goalId": "run_5km",
        "reflection": "I completed my 5km run today. It was challenging but rewarding. I felt strong and accomplished.",
        "imageDataUrl": valid_image_data_url,
    }


class TestHealthEndpoint:
    """Test health check endpoint"""

    def test_health_check_returns_ok(self):
        """Health check should return 200 with service info"""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["service"] == "pob-backend"
        assert "version" in data


class TestProofVerificationFlow:
    """Test the complete proof verification flow"""

    def test_submit_valid_proof(self, valid_proof_request):
        """Valid proof submission should return verification result"""
        response = client.post("/api/verify", json=valid_proof_request)

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "verified" in data
        assert "confidence" in data
        assert "reason" in data
        assert "feedback" in data
        assert "checks" in data

        # Check confidence score
        assert 0 <= data["confidence"] <= 100

        # Check verification checks
        checks = data["checks"]
        assert checks["validGoal"] is True
        assert checks["sufficientReflection"] is True
        assert checks["validImage"] is True

    def test_reject_invalid_goal_id(self, valid_proof_request):
        """Invalid goal ID should fail validation"""
        invalid_request = valid_proof_request.copy()
        invalid_request["goalId"] = "invalid_goal_123"

        response = client.post("/api/verify", json=invalid_request)

        assert response.status_code == 200  # Returns 200 but verified=false
        data = response.json()
        assert data["verified"] is False
        assert data["checks"]["validGoal"] is False

    def test_reject_short_reflection(self, valid_proof_request):
        """Reflection that's too short should fail validation"""
        invalid_request = valid_proof_request.copy()
        invalid_request["reflection"] = "Too short"

        response = client.post("/api/verify", json=invalid_request)

        assert response.status_code == 200
        data = response.json()
        assert data["verified"] is False
        assert data["checks"]["sufficientReflection"] is False

    def test_reject_invalid_image_format(self, valid_proof_request):
        """Invalid image data URL should fail validation"""
        invalid_request = valid_proof_request.copy()
        invalid_request["imageDataUrl"] = "not-a-valid-data-url"

        response = client.post("/api/verify", json=invalid_request)

        assert response.status_code == 200
        data = response.json()
        assert data["verified"] is False
        assert data["checks"]["validImage"] is False

    def test_second_photo_verification(self, valid_proof_request, valid_image_data_url):
        """Submitting second photo should be accepted"""
        request_with_second = valid_proof_request.copy()
        request_with_second["secondImageDataUrl"] = valid_image_data_url

        response = client.post("/api/verify", json=request_with_second)

        assert response.status_code == 200
        data = response.json()
        # Should process without error (verification result may vary)
        assert "verified" in data


class TestQuantumSeedGeneration:
    """Test quantum random seed generation flow"""

    def test_generate_quantum_seed(self):
        """Should generate a random seed"""
        response = client.get("/api/quantum-seed")

        assert response.status_code == 200
        data = response.json()

        # Check response structure
        assert "seed" in data
        assert "source" in data
        assert "timestamp" in data
        assert "size" in data

        # Check seed properties
        assert len(data["seed"]) == 64  # 32 bytes = 64 hex chars
        assert data["source"] in ["quantum", "pseudo"]
        assert data["size"] == 32

    def test_multiple_seeds_are_unique(self):
        """Multiple seed requests should generate different seeds"""
        response1 = client.get("/api/quantum-seed")
        response2 = client.get("/api/quantum-seed")

        assert response1.status_code == 200
        assert response2.status_code == 200

        seed1 = response1.json()["seed"]
        seed2 = response2.json()["seed"]

        assert seed1 != seed2

    def test_custom_seed_size(self):
        """Should support custom seed sizes"""
        response = client.get("/api/quantum-seed?size=16")

        assert response.status_code == 200
        data = response.json()
        assert len(data["seed"]) == 32  # 16 bytes = 32 hex chars
        assert data["size"] == 16


class TestIPFSPinning:
    """Test IPFS pinning flow (may fail if IPFS unavailable)"""

    def test_pin_request_validation(self):
        """IPFS pin request should validate input"""
        # Invalid base64 data
        response = client.post(
            "/api/ipfs/pin",
            json={"data": "not-valid-base64!", "metadata": {"type": "test"}},
        )

        # Should fail validation
        assert response.status_code in [400, 503]  # 400 for validation, 503 if IPFS down

    def test_pin_data_structure(self):
        """Valid pin request should have correct structure"""
        valid_data = base64.b64encode(b"test data").decode()

        response = client.post(
            "/api/ipfs/pin", json={"data": valid_data, "metadata": {"type": "test"}}
        )

        # May fail if IPFS unavailable, but should return proper structure
        if response.status_code == 200:
            data = response.json()
            assert "cid" in data
            assert "uri" in data
        else:
            # IPFS unavailable is acceptable (503)
            assert response.status_code == 503


class TestRateLimiting:
    """Test rate limiting across endpoints"""

    def test_verify_endpoint_rate_limit(self, valid_proof_request):
        """Verify endpoint should enforce rate limits"""
        # Make 6 requests (limit is 5/minute)
        for i in range(6):
            response = client.post("/api/verify", json=valid_proof_request)

            if i < 5:
                # First 5 should work
                assert response.status_code == 200
            else:
                # 6th should be rate limited
                assert response.status_code == 429
                assert "rate limit" in response.json()["detail"].lower()

    def test_qrng_endpoint_rate_limit(self):
        """QRNG endpoint should enforce rate limits"""
        # Make 11 requests (limit is 10/minute)
        responses = []
        for _ in range(11):
            responses.append(client.get("/api/quantum-seed"))

        # Check last response is rate limited
        assert responses[-1].status_code == 429


class TestErrorHandling:
    """Test error handling and recovery"""

    def test_malformed_json_request(self):
        """Malformed JSON should return 422"""
        response = client.post(
            "/api/verify",
            data="not-json",
            headers={"Content-Type": "application/json"},
        )

        assert response.status_code == 422

    def test_missing_required_fields(self):
        """Missing required fields should return validation error"""
        response = client.post("/api/verify", json={"goalId": "run_5km"})

        assert response.status_code == 422


class TestCompleteFlow:
    """Test complete end-to-end workflow"""

    def test_happy_path_workflow(self, valid_proof_request, valid_image_data_url):
        """Test complete workflow: verify → generate seed → (pin to IPFS)"""
        # Step 1: Verify proof
        verify_response = client.post("/api/verify", json=valid_proof_request)
        assert verify_response.status_code == 200
        verify_data = verify_response.json()

        # Step 2: If verified, generate quantum seed
        if verify_data["verified"]:
            seed_response = client.get("/api/quantum-seed")
            assert seed_response.status_code == 200
            seed_data = seed_response.json()
            assert "seed" in seed_data

            # Step 3: Could pin artwork to IPFS (optional, may fail if IPFS down)
            artwork_data = base64.b64encode(b"fake-artwork-data").decode()
            ipfs_response = client.post(
                "/api/ipfs/pin",
                json={
                    "data": artwork_data,
                    "metadata": {
                        "type": "image",
                        "seed": seed_data["seed"],
                        "stage": 1,
                    },
                },
            )

            # IPFS may be unavailable, that's ok
            assert ipfs_response.status_code in [200, 503]

            print("✓ Complete workflow executed successfully")
        else:
            # Verification failed - check reason
            print(f"Verification failed: {verify_data['reason']}")
