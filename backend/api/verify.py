"""
AI Verification API for Proof of Becoming.

Provides proof verification using heuristic checks and optional AI vision model.
"""

import base64
import os
import re
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Request
from middleware.ratelimit import limiter, VERIFY_LIMIT

router = APIRouter(prefix="/api/verify", tags=["verification"])

# Valid goal IDs (from frontend goal templates)
VALID_GOALS = {
    "run_5km": "Run 5km",
    "read_20_pages": "Read 20 pages",
    "meditate_10min": "Meditate 10 minutes",
    "make_sketch": "Make a sketch",
    "custom": "Custom goal",
}

# Minimum reflection length (characters)
MIN_REFLECTION_LENGTH = 20

# Confidence thresholds
CONFIDENCE_THRESHOLD_PASS = 70  # Minimum confidence to pass
CONFIDENCE_THRESHOLD_SECOND_PHOTO = 60  # Request second photo if below this


class VerifyRequest(BaseModel):
    goalId: str = Field(..., description="Goal identifier")
    reflection: str = Field(..., description="User's reflection text")
    imageDataUrl: str = Field(..., description="Base64 data URL of proof image")
    secondImageDataUrl: Optional[str] = Field(
        None, description="Optional second image for low confidence cases"
    )


class VerificationChecks(BaseModel):
    validGoal: bool
    sufficientReflection: bool
    validImage: bool
    aiVerified: Optional[bool] = None


class VerifyResponse(BaseModel):
    verified: bool
    confidence: int = Field(..., ge=0, le=100, description="Confidence score 0-100")
    reason: str
    feedback: str
    needsSecondPhoto: bool = False
    checks: VerificationChecks


def validate_data_url(data_url: str) -> bool:
    """Validate that a string is a properly formatted data URL."""
    if not data_url:
        return False

    # Check data URL format: data:[<mediatype>][;base64],<data>
    pattern = r"^data:image/(png|jpeg|jpg|gif|webp);base64,([A-Za-z0-9+/=]+)$"
    match = re.match(pattern, data_url)

    if not match:
        return False

    # Try to decode base64 data
    try:
        base64_data = match.group(2)
        base64.b64decode(base64_data, validate=True)
        return True
    except Exception:
        return False


def heuristic_verification(
    goal_id: str, reflection: str, image_data_url: str
) -> tuple[bool, int, str, VerificationChecks]:
    """
    Perform heuristic verification checks.

    Returns:
        (verified, confidence, reason, checks)
    """
    checks = VerificationChecks(
        validGoal=False, sufficientReflection=False, validImage=False
    )

    confidence = 0
    reasons = []

    # Check 1: Valid goal ID
    if goal_id not in VALID_GOALS:
        reasons.append(f"Invalid goal ID: '{goal_id}'")
    else:
        checks.validGoal = True
        confidence += 30

    # Check 2: Sufficient reflection length
    reflection_length = len(reflection.strip())
    if reflection_length < MIN_REFLECTION_LENGTH:
        reasons.append(
            f"Reflection too short ({reflection_length} chars, minimum {MIN_REFLECTION_LENGTH})"
        )
    else:
        checks.sufficientReflection = True
        # Award more points for longer reflections (up to 30 points)
        length_bonus = min(30, (reflection_length // 10))
        confidence += length_bonus

    # Check 3: Valid image format
    if not validate_data_url(image_data_url):
        reasons.append("Invalid image data URL format")
    else:
        checks.validImage = True
        confidence += 20

    # Check 4: Reflection mentions the goal
    goal_name = VALID_GOALS.get(goal_id, "").lower()
    reflection_lower = reflection.lower()

    # Extract keywords from goal name
    goal_keywords = set(goal_name.split())
    reflection_words = set(reflection_lower.split())

    # Check if any goal keywords appear in reflection
    if goal_keywords & reflection_words:
        confidence += 20
    else:
        # Not a hard failure, but reduces confidence
        confidence = max(0, confidence - 10)

    verified = all([checks.validGoal, checks.sufficientReflection, checks.validImage])
    reason = "; ".join(reasons) if reasons else "All heuristic checks passed"

    return verified, confidence, reason, checks


async def ai_vision_verification(
    goal_id: str, reflection: str, image_data_url: str, second_image_data_url: Optional[str] = None
) -> tuple[int, str]:
    """
    Perform AI vision model verification using Groq Vision API.

    Returns:
        (confidence_adjustment, feedback)
    """
    # Check if Groq API key is configured
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return 0, "AI verification not configured (no API key)"

    try:
        import httpx

        goal_name = VALID_GOALS.get(goal_id, goal_id)

        # Prepare prompt for vision model
        prompt = f"""You are verifying a proof submission for the goal: "{goal_name}".

The user provided this reflection:
"{reflection}"

Analyze the provided image(s) and determine if they genuinely show evidence of completing the goal.

Respond with a JSON object containing:
- "plausible": boolean (true if image shows evidence of goal completion)
- "confidence": number 0-100 (your confidence in the verification)
- "feedback": string (brief feedback for the user)

Consider:
1. Does the image relate to the stated goal?
2. Does the reflection match what's shown in the image?
3. Are there signs of genuine effort vs. stock photos?
"""

        # Prepare image(s) for API
        images = [{"type": "image_url", "image_url": {"url": image_data_url}}]

        if second_image_data_url:
            images.append(
                {"type": "image_url", "image_url": {"url": second_image_data_url}}
            )
            prompt += "\n\nA second image was provided for additional verification."

        # Call Groq Vision API (using llama-3.2-90b-vision-preview)
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": "llama-3.2-90b-vision-preview",
            "messages": [
                {
                    "role": "user",
                    "content": [{"type": "text", "text": prompt}] + images,
                }
            ],
            "max_tokens": 300,
            "temperature": 0.5,
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0,
            )

            if response.status_code != 200:
                return 0, f"AI verification failed: HTTP {response.status_code}"

            data = response.json()
            ai_response = data["choices"][0]["message"]["content"]

            # Parse AI response (expecting JSON)
            import json

            try:
                result = json.loads(ai_response)
                plausible = result.get("plausible", False)
                ai_confidence = result.get("confidence", 50)
                feedback = result.get("feedback", "AI verification completed")

                # Adjust confidence based on AI result
                if plausible:
                    confidence_adjustment = int(ai_confidence * 0.3)  # Up to +30
                else:
                    confidence_adjustment = -20  # Penalty for implausible

                return confidence_adjustment, feedback

            except json.JSONDecodeError:
                # AI didn't return valid JSON, extract info from text
                return 0, f"AI feedback: {ai_response[:200]}"

    except Exception as e:
        print(f"AI verification error: {e}")
        return 0, f"AI verification unavailable: {str(e)}"


@router.post("", response_model=VerifyResponse)
@limiter.limit(VERIFY_LIMIT)
async def verify_proof(request: Request, body: VerifyRequest):
    """
    Verify a proof submission for a goal.

    Performs:
    1. Heuristic checks (goal validity, reflection length, image format)
    2. Optional AI vision verification (if API key configured)
    3. Returns verification result with confidence score
    """
    # Step 1: Heuristic verification
    verified, confidence, reason, checks = heuristic_verification(
        body.goalId, body.reflection, body.imageDataUrl
    )

    feedback = ""

    # Step 2: AI vision verification (if configured and heuristics passed)
    if verified:
        ai_adjustment, ai_feedback = await ai_vision_verification(
            body.goalId,
            body.reflection,
            body.imageDataUrl,
            body.secondImageDataUrl,
        )

        confidence = max(0, min(100, confidence + ai_adjustment))
        feedback = ai_feedback
        checks.aiVerified = ai_adjustment > 0
    else:
        feedback = reason

    # Step 3: Determine final verification result
    final_verified = verified and confidence >= CONFIDENCE_THRESHOLD_PASS
    needs_second_photo = (
        verified
        and not body.secondImageDataUrl
        and CONFIDENCE_THRESHOLD_SECOND_PHOTO <= confidence < CONFIDENCE_THRESHOLD_PASS
    )

    # Generate user-friendly feedback
    if final_verified:
        feedback = (
            feedback
            or f"Proof verified! Your {VALID_GOALS.get(body.goalId)} goal is confirmed."
        )
    elif needs_second_photo:
        feedback = f"Verification uncertain (confidence: {confidence}%). Please submit a second photo for additional verification."
    elif not verified:
        feedback = f"Verification failed: {reason}"
    else:
        feedback = feedback or f"Confidence too low ({confidence}%). Please provide clearer evidence."

    return VerifyResponse(
        verified=final_verified,
        confidence=confidence,
        reason=reason if not final_verified else "Verified",
        feedback=feedback,
        needsSecondPhoto=needs_second_photo,
        checks=checks,
    )
