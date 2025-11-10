"""
Tests for Retry Utility

Tests exponential backoff retry logic for external service calls
"""

import pytest
from unittest.mock import AsyncMock, Mock
import asyncio
from lib.retry import retry_async, retry_with_exponential_backoff, RetryConfig


@pytest.mark.asyncio
async def test_retry_succeeds_on_first_try():
    """Successful call should not retry"""
    mock_func = AsyncMock(return_value="success")

    result = await retry_async(mock_func)

    assert result == "success"
    assert mock_func.call_count == 1


@pytest.mark.asyncio
async def test_retry_succeeds_after_failures():
    """Should retry and eventually succeed"""
    mock_func = AsyncMock(
        side_effect=[Exception("fail1"), Exception("fail2"), "success"]
    )

    config = RetryConfig(max_attempts=3, initial_delay=0.01)
    result = await retry_async(mock_func, config=config)

    assert result == "success"
    assert mock_func.call_count == 3


@pytest.mark.asyncio
async def test_retry_exhausts_attempts():
    """Should raise exception after max attempts"""
    mock_func = AsyncMock(side_effect=Exception("persistent failure"))

    config = RetryConfig(max_attempts=3, initial_delay=0.01)

    with pytest.raises(Exception, match="persistent failure"):
        await retry_async(mock_func, config=config)

    assert mock_func.call_count == 3


@pytest.mark.asyncio
async def test_retry_exponential_backoff():
    """Delays should increase exponentially"""
    call_times = []

    async def failing_func():
        call_times.append(asyncio.get_event_loop().time())
        raise Exception("fail")

    config = RetryConfig(max_attempts=3, initial_delay=0.05, max_delay=1.0)

    try:
        await retry_async(failing_func, config=config)
    except Exception:
        pass

    # Check that delays increased
    assert len(call_times) == 3
    # Second call should be after ~50ms
    assert call_times[1] - call_times[0] >= 0.04
    # Third call should be after ~100ms (2x backoff)
    assert call_times[2] - call_times[1] >= 0.08


@pytest.mark.asyncio
async def test_retry_respects_max_delay():
    """Delay should not exceed max_delay"""
    call_times = []

    async def failing_func():
        call_times.append(asyncio.get_event_loop().time())
        raise Exception("fail")

    config = RetryConfig(max_attempts=5, initial_delay=0.1, max_delay=0.15)

    try:
        await retry_async(failing_func, config=config)
    except Exception:
        pass

    # Later delays should be capped at max_delay
    for i in range(2, len(call_times)):
        delay = call_times[i] - call_times[i - 1]
        assert delay <= 0.2  # Allow small tolerance


@pytest.mark.asyncio
async def test_retry_specific_exceptions():
    """Should only retry specific exception types"""

    class RetryableError(Exception):
        pass

    class NonRetryableError(Exception):
        pass

    mock_func = AsyncMock(side_effect=NonRetryableError("don't retry"))

    config = RetryConfig(
        max_attempts=3,
        initial_delay=0.01,
        retryable_exceptions=(RetryableError,)
    )

    with pytest.raises(NonRetryableError):
        await retry_async(mock_func, config=config)

    # Should fail immediately, not retry
    assert mock_func.call_count == 1


@pytest.mark.asyncio
async def test_retry_with_decorator():
    """Decorator should apply retry logic"""
    call_count = 0

    @retry_with_exponential_backoff(max_attempts=3, initial_delay=0.01)
    async def flaky_function():
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            raise Exception("not yet")
        return "success"

    result = await flaky_function()

    assert result == "success"
    assert call_count == 3


def test_retry_config_defaults():
    """RetryConfig should have sensible defaults"""
    config = RetryConfig()

    assert config.max_attempts == 3
    assert config.initial_delay == 1.0
    assert config.max_delay == 60.0
    assert config.backoff_factor == 2.0
    assert config.retryable_exceptions == (Exception,)


@pytest.mark.asyncio
async def test_retry_with_jitter():
    """Jitter should add randomness to delays"""
    call_times = []

    async def failing_func():
        call_times.append(asyncio.get_event_loop().time())
        raise Exception("fail")

    config = RetryConfig(
        max_attempts=4,
        initial_delay=0.1,
        jitter=True
    )

    try:
        await retry_async(failing_func, config=config)
    except Exception:
        pass

    # With jitter, delays should vary
    delays = [call_times[i] - call_times[i - 1] for i in range(1, len(call_times))]

    # At least some delays should be different (jitter adds randomness)
    assert len(set(delays)) > 1 or len(delays) == 1
