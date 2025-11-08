"""
IPFS API endpoints for pinning and retrieving encrypted diary data

All data is encrypted client-side before pinning to IPFS
This ensures privacy even on public IPFS network
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
import base64
import os
import httpx
from typing import Optional, Dict, Any


router = APIRouter(prefix="/api/ipfs", tags=["ipfs"])


# Configuration
IPFS_API_URL = os.getenv("IPFS_API_URL", "http://127.0.0.1:5001")
IPFS_GATEWAY = os.getenv("IPFS_GATEWAY", "https://ipfs.io/ipfs/")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB max


# Request/Response models
class PinRequest(BaseModel):
    data: str = Field(..., description="Base64-encoded encrypted data")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Optional metadata (not encrypted)")


class PinResponse(BaseModel):
    cid: str = Field(..., description="IPFS Content Identifier")
    uri: str = Field(..., description="IPFS URI (ipfs://...)")
    size: int = Field(..., description="Size in bytes")


class RetrieveResponse(BaseModel):
    data: str = Field(..., description="Base64-encoded encrypted data")
    size: int = Field(..., description="Size in bytes")


class IPFSHealthResponse(BaseModel):
    ipfs_available: bool
    api_url: str
    gateway: str


# Helper functions
def is_ipfs_available() -> bool:
    """Check if IPFS node is available"""
    try:
        response = httpx.get(f"{IPFS_API_URL}/api/v0/version", timeout=2.0)
        return response.status_code == 200
    except Exception:
        return False


async def pin_to_ipfs(data: bytes) -> str:
    """
    Pin data to IPFS node

    Args:
        data: Raw bytes to pin

    Returns:
        IPFS CID (Content Identifier)
    """
    try:
        # Use IPFS HTTP API
        files = {"file": data}
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{IPFS_API_URL}/api/v0/add",
                files=files,
                params={"pin": "true"},  # Pin by default
                timeout=30.0
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"IPFS add failed: {response.text}"
            )

        result = response.json()
        return result["Hash"]

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="IPFS node timeout"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"IPFS error: {str(e)}"
        )


async def retrieve_from_ipfs(cid: str) -> bytes:
    """
    Retrieve data from IPFS

    Args:
        cid: IPFS Content Identifier

    Returns:
        Raw bytes from IPFS
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{IPFS_API_URL}/api/v0/cat",
                params={"arg": cid},
                timeout=30.0
            )

        if response.status_code == 200:
            return response.content
        elif response.status_code == 404:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"CID not found: {cid}"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"IPFS cat failed: {response.text}"
            )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="IPFS node timeout"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"IPFS error: {str(e)}"
        )


# Endpoints
@router.post("/pin", response_model=PinResponse)
async def pin_encrypted_data(request: PinRequest):
    """
    Pin encrypted data to IPFS

    **Privacy:** Data must be encrypted client-side before calling this endpoint.
    Only encrypted blobs are pinned to IPFS, never plaintext.

    **Size Limit:** 10MB per file

    Returns IPFS CID and URI for later retrieval.
    """
    # Decode base64 data
    try:
        data_bytes = base64.b64decode(request.data)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 data"
        )

    # Check size limit
    if len(data_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Data exceeds max size of {MAX_FILE_SIZE} bytes"
        )

    # Check IPFS availability
    if not is_ipfs_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="IPFS node not available"
        )

    # Pin to IPFS
    cid = await pin_to_ipfs(data_bytes)

    return PinResponse(
        cid=cid,
        uri=f"ipfs://{cid}",
        size=len(data_bytes)
    )


@router.get("/{cid}", response_model=RetrieveResponse)
async def retrieve_encrypted_data(cid: str):
    """
    Retrieve encrypted data from IPFS

    **Privacy:** Returns encrypted data. Client must decrypt with their key.

    Args:
        cid: IPFS Content Identifier

    Returns base64-encoded encrypted data.
    """
    # Check IPFS availability
    if not is_ipfs_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="IPFS node not available"
        )

    # Retrieve from IPFS
    data_bytes = await retrieve_from_ipfs(cid)

    # Encode to base64 for JSON response
    data_base64 = base64.b64encode(data_bytes).decode()

    return RetrieveResponse(
        data=data_base64,
        size=len(data_bytes)
    )


@router.get("/health", response_model=IPFSHealthResponse)
async def ipfs_health():
    """
    Check IPFS node availability

    Returns IPFS status and configuration.
    """
    available = is_ipfs_available()

    return IPFSHealthResponse(
        ipfs_available=available,
        api_url=IPFS_API_URL,
        gateway=IPFS_GATEWAY
    )
