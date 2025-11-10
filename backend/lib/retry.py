"""
Retry Utility with Exponential Backoff

Provides retry logic for external service calls with configurable backoff
"""

import asyncio
import random
import logging
from typing import TypeVar, Callable, Tuple, Type
from dataclasses import dataclass

logger = logging.getLogger(__name__)

T = TypeVar("T")


@dataclass
class RetryConfig:
    """Configuration for retry behavior"""

    max_attempts: int = 3
    initial_delay: float = 1.0  # seconds
    max_delay: float = 60.0  # seconds
    backoff_factor: float = 2.0  # exponential backoff multiplier
    jitter: bool = True  # add randomness to delays
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,)


async def retry_async(
    func: Callable[..., T],
    *args,
    config: RetryConfig | None = None,
    **kwargs
) -> T:
    """
    Retry an async function with exponential backoff.

    Args:
        func: Async function to retry
        *args: Positional arguments for func
        config: Retry configuration (uses defaults if None)
        **kwargs: Keyword arguments for func

    Returns:
        Result from successful function call

    Raises:
        Exception from last failed attempt if all retries exhausted
    """
    if config is None:
        config = RetryConfig()

    last_exception = None
    delay = config.initial_delay

    for attempt in range(1, config.max_attempts + 1):
        try:
            result = await func(*args, **kwargs)
            if attempt > 1:
                logger.info(f"Succeeded on attempt {attempt}/{config.max_attempts}")
            return result

        except config.retryable_exceptions as e:
            last_exception = e

            if attempt == config.max_attempts:
                logger.error(
                    f"All {config.max_attempts} attempts failed. Last error: {e}"
                )
                raise

            # Calculate delay with exponential backoff
            current_delay = min(delay, config.max_delay)

            # Add jitter if enabled
            if config.jitter:
                jitter_range = current_delay * 0.1  # 10% jitter
                current_delay += random.uniform(-jitter_range, jitter_range)
                current_delay = max(0, current_delay)  # Ensure non-negative

            logger.warning(
                f"Attempt {attempt}/{config.max_attempts} failed: {e}. "
                f"Retrying in {current_delay:.2f}s..."
            )

            await asyncio.sleep(current_delay)

            # Increase delay for next attempt
            delay *= config.backoff_factor

    # Should never reach here, but for type safety
    if last_exception:
        raise last_exception
    raise Exception("Retry logic error")


def retry_with_exponential_backoff(
    max_attempts: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 60.0,
    backoff_factor: float = 2.0,
    jitter: bool = True,
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,),
):
    """
    Decorator to add retry logic with exponential backoff to async functions.

    Usage:
        @retry_with_exponential_backoff(max_attempts=3, initial_delay=2.0)
        async def my_function():
            # This will retry up to 3 times with exponential backoff
            pass
    """

    def decorator(func: Callable):
        async def wrapper(*args, **kwargs):
            config = RetryConfig(
                max_attempts=max_attempts,
                initial_delay=initial_delay,
                max_delay=max_delay,
                backoff_factor=backoff_factor,
                jitter=jitter,
                retryable_exceptions=retryable_exceptions,
            )
            return await retry_async(func, *args, config=config, **kwargs)

        return wrapper

    return decorator


# Predefined configurations for common use cases

# Quick retries for fast operations
QUICK_RETRY = RetryConfig(
    max_attempts=3,
    initial_delay=0.5,
    max_delay=5.0,
    backoff_factor=2.0,
)

# Standard retries for most operations
STANDARD_RETRY = RetryConfig(
    max_attempts=3,
    initial_delay=1.0,
    max_delay=30.0,
    backoff_factor=2.0,
)

# Patient retries for expensive operations
PATIENT_RETRY = RetryConfig(
    max_attempts=5,
    initial_delay=2.0,
    max_delay=60.0,
    backoff_factor=2.0,
)

# Network-specific retries (for external APIs)
NETWORK_RETRY = RetryConfig(
    max_attempts=4,
    initial_delay=2.0,
    max_delay=16.0,
    backoff_factor=2.0,
    retryable_exceptions=(
        Exception,  # Catch-all, but in production would specify network errors
    ),
)
