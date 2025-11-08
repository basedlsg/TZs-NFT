"""
Rate Limiting Middleware

Implements per-IP rate limiting to prevent API abuse
Uses in-memory storage for simplicity (replace with Redis for production)
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

# Create rate limiter instance
# Uses client IP address as the key
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    """
    Custom handler for rate limit exceeded errors

    Returns a JSON response with 429 status code
    """
    logger.warning(
        f"Rate limit exceeded for {get_remote_address(request)} on {request.url.path}"
    )

    return JSONResponse(
        status_code=429,
        content={
            "detail": f"Rate limit exceeded. Please try again later. (Limit: {exc.detail})"
        },
        headers={
            "Retry-After": "60",  # Suggest retry after 60 seconds
        },
    )


# Rate limit configurations for different endpoints
# Format: "requests per time_period"

# Verification endpoint: expensive AI operation
VERIFY_LIMIT = "5/minute"

# QRNG endpoint: external API call
QRNG_LIMIT = "10/minute"

# IPFS pin endpoint: external service
IPFS_LIMIT = "3/minute"

# Read-only endpoints: more generous
HEALTH_LIMIT = "60/minute"
