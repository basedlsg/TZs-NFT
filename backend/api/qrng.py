"""
Quantum Random Number Generation (QRNG) API for Proof of Becoming.

Provides cryptographically secure random seeds for NFT evolution art generation.
Uses quantum random number sources when available, falls back to CSPRNG.
"""

import os
import secrets
import time
from typing import Literal
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query, Request
from middleware.ratelimit import limiter, QRNG_LIMIT
from lib.retry import retry_async, NETWORK_RETRY

router = APIRouter(prefix="/api/quantum-seed", tags=["qrng"])

# Constants
DEFAULT_SEED_SIZE = 32  # 32 bytes = 256 bits
MAX_SEED_SIZE = 128  # 128 bytes maximum
MIN_SEED_SIZE = 16  # 16 bytes minimum


class QuantumSeedResponse(BaseModel):
    seed: str = Field(..., description="Hex-encoded random seed")
    source: Literal["quantum", "pseudo"] = Field(
        ..., description="Source of randomness (quantum or pseudo)"
    )
    timestamp: int = Field(..., description="Unix timestamp of generation")
    size: int = Field(..., description="Size in bytes")


async def _fetch_quantum_bytes(num_bytes: int) -> bytes:
    """
    Internal function to fetch quantum random bytes.

    Raises exception on failure (for retry logic).
    """
    import httpx

    # ANU QRNG API
    # https://qrng.anu.edu.au/API/api-demo.php
    url = "https://qrng.anu.edu.au/API/jsonI.php"

    params = {
        "length": num_bytes,
        "type": "uint8",  # Return unsigned 8-bit integers
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=5.0)

        if response.status_code != 200:
            raise Exception(f"QRNG API returned status {response.status_code}")

        data = response.json()

        if not data.get("success"):
            raise Exception("QRNG API returned success=false")

        # ANU returns array of uint8 values
        random_values = data.get("data", [])

        if len(random_values) != num_bytes:
            raise Exception(
                f"QRNG API returned {len(random_values)} bytes, expected {num_bytes}"
            )

        # Convert to bytes
        return bytes(random_values)


async def get_quantum_random_bytes(num_bytes: int) -> bytes | None:
    """
    Fetch quantum random bytes from ANU Quantum Random Numbers service.

    Uses retry logic with exponential backoff for reliability.

    Returns:
        bytes if successful, None if quantum source unavailable after retries
    """
    try:
        # Use retry logic for robustness
        result = await retry_async(_fetch_quantum_bytes, num_bytes, config=NETWORK_RETRY)
        return result

    except Exception as e:
        print(f"Quantum RNG error after retries: {e}")
        return None


def get_pseudo_random_bytes(num_bytes: int) -> bytes:
    """
    Generate cryptographically secure pseudo-random bytes using Python's secrets module.

    This is the fallback when quantum sources are unavailable.
    Uses os.urandom() internally, which is cryptographically secure.
    """
    return secrets.token_bytes(num_bytes)


@router.get("", response_model=QuantumSeedResponse)
@limiter.limit(QRNG_LIMIT)
async def generate_quantum_seed(
    request: Request,
    size: int = Query(
        DEFAULT_SEED_SIZE,
        ge=MIN_SEED_SIZE,
        le=MAX_SEED_SIZE,
        description=f"Seed size in bytes (default: {DEFAULT_SEED_SIZE})",
    )
):
    """
    Generate a quantum random seed for NFT evolution.

    Attempts to use ANU Quantum Random Number Generator.
    Falls back to cryptographically secure pseudo-random generator (CSPRNG) if unavailable.

    The seed is used to deterministically generate unique NFT artwork.
    """
    timestamp = int(time.time() * 1000)  # Milliseconds

    # Try quantum source first
    quantum_bytes = await get_quantum_random_bytes(size)

    if quantum_bytes is not None:
        # Quantum source succeeded
        seed_hex = quantum_bytes.hex()
        source = "quantum"
    else:
        # Fall back to CSPRNG
        pseudo_bytes = get_pseudo_random_bytes(size)
        seed_hex = pseudo_bytes.hex()
        source = "pseudo"

    return QuantumSeedResponse(
        seed=seed_hex,
        source=source,
        timestamp=timestamp,
        size=size,
    )
