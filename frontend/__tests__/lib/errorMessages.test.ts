/**
 * Tests for Error Message Utilities
 *
 * Tests user-friendly error message formatting and translation
 */

import {
  getErrorMessage,
  formatApiError,
  isNetworkError,
  ErrorCategory,
  getSuggestionForError
} from '@/lib/errorMessages';

describe('Error Message Utilities', () => {
  describe('getErrorMessage', () => {
    test('extracts message from Error object', () => {
      const error = new Error('Something went wrong');
      expect(getErrorMessage(error)).toBe('Something went wrong');
    });

    test('extracts message from API error response', () => {
      const error = {
        response: {
          data: {
            detail: 'Invalid input data',
          },
        },
      };
      expect(getErrorMessage(error)).toBe('Invalid input data');
    });

    test('handles string errors', () => {
      expect(getErrorMessage('Error string')).toBe('Error string');
    });

    test('handles unknown error types', () => {
      expect(getErrorMessage(null)).toBe('An unexpected error occurred');
      expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
      expect(getErrorMessage({})).toBe('An unexpected error occurred');
    });
  });

  describe('formatApiError', () => {
    test('formats rate limit error with user-friendly message', () => {
      const error = {
        response: {
          status: 429,
          data: {
            detail: 'Rate limit exceeded',
          },
        },
      };

      const result = formatApiError(error);

      expect(result.message).toContain('too many requests');
      expect(result.category).toBe(ErrorCategory.RATE_LIMIT);
      expect(result.userFriendly).toBe(true);
    });

    test('formats validation error with specific details', () => {
      const error = {
        response: {
          status: 400,
          data: {
            detail: 'Image is too large',
          },
        },
      };

      const result = formatApiError(error);

      expect(result.message).toContain('Image is too large');
      expect(result.category).toBe(ErrorCategory.VALIDATION);
    });

    test('formats network error with helpful message', () => {
      const error = new Error('Network Error');

      const result = formatApiError(error);

      expect(result.message).toContain('connection');
      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.suggestion).toBeTruthy();
    });

    test('formats 503 service unavailable error', () => {
      const error = {
        response: {
          status: 503,
          data: {
            detail: 'IPFS node timeout',
          },
        },
      };

      const result = formatApiError(error);

      expect(result.category).toBe(ErrorCategory.SERVICE_UNAVAILABLE);
      expect(result.suggestion).toContain('try again');
    });
  });

  describe('isNetworkError', () => {
    test('identifies network errors', () => {
      expect(isNetworkError(new Error('Network Error'))).toBe(true);
      expect(isNetworkError(new Error('fetch failed'))).toBe(true);
      expect(isNetworkError(new Error('ECONNREFUSED'))).toBe(true);
    });

    test('rejects non-network errors', () => {
      expect(isNetworkError(new Error('Validation failed'))).toBe(false);
      expect(isNetworkError({ response: { status: 400 } })).toBe(false);
    });
  });

  describe('getSuggestionForError', () => {
    test('provides suggestion for rate limit errors', () => {
      const suggestion = getSuggestionForError(ErrorCategory.RATE_LIMIT);

      expect(suggestion).toContain('wait');
      expect(suggestion).toBeTruthy();
    });

    test('provides suggestion for network errors', () => {
      const suggestion = getSuggestionForError(ErrorCategory.NETWORK);

      expect(suggestion).toContain('connection');
    });

    test('provides suggestion for validation errors', () => {
      const suggestion = getSuggestionForError(ErrorCategory.VALIDATION);

      expect(suggestion).toContain('check');
    });

    test('returns null for unknown categories', () => {
      const suggestion = getSuggestionForError('UNKNOWN' as ErrorCategory);

      expect(suggestion).toBeNull();
    });
  });
});
