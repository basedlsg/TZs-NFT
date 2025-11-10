/**
 * Error Message Utilities
 *
 * Provides user-friendly error messages and categorization
 */

export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  RATE_LIMIT = 'rate_limit',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  AUTHENTICATION = 'authentication',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown',
}

export interface FormattedError {
  message: string;
  category: ErrorCategory;
  suggestion: string | null;
  userFriendly: boolean;
  originalError?: any;
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: any): string {
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle API error responses
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Default fallback
  return 'An unexpected error occurred';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  const message = getErrorMessage(error).toLowerCase();

  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('econnrefused') ||
    message.includes('timeout') ||
    message.includes('connection')
  );
}

/**
 * Categorize error by type
 */
function categorizeError(error: any): ErrorCategory {
  const status = error?.response?.status;
  const message = getErrorMessage(error).toLowerCase();

  // HTTP status code categories
  if (status === 429) return ErrorCategory.RATE_LIMIT;
  if (status === 400 || status === 422) return ErrorCategory.VALIDATION;
  if (status === 401 || status === 403) return ErrorCategory.AUTHENTICATION;
  if (status === 404) return ErrorCategory.NOT_FOUND;
  if (status === 503) return ErrorCategory.SERVICE_UNAVAILABLE;

  // Message-based categorization
  if (isNetworkError(error)) return ErrorCategory.NETWORK;
  if (message.includes('rate limit')) return ErrorCategory.RATE_LIMIT;
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorCategory.VALIDATION;
  }
  if (message.includes('unavailable') || message.includes('timeout')) {
    return ErrorCategory.SERVICE_UNAVAILABLE;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Get user-friendly suggestion for error category
 */
export function getSuggestionForError(category: ErrorCategory): string | null {
  const suggestions: Record<ErrorCategory, string> = {
    [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
    [ErrorCategory.NETWORK]:
      'Please check your internet connection and try again.',
    [ErrorCategory.RATE_LIMIT]:
      'Please wait a moment before trying again. You may have exceeded the request limit.',
    [ErrorCategory.SERVICE_UNAVAILABLE]:
      'The service is temporarily unavailable. Please try again in a few moments.',
    [ErrorCategory.AUTHENTICATION]:
      'Please connect your wallet and try again.',
    [ErrorCategory.NOT_FOUND]: 'The requested resource could not be found.',
    [ErrorCategory.UNKNOWN]: 'If the problem persists, please contact support.',
  };

  return suggestions[category] || null;
}

/**
 * Format error into user-friendly message
 */
export function formatApiError(error: any): FormattedError {
  const category = categorizeError(error);
  const rawMessage = getErrorMessage(error);
  const suggestion = getSuggestionForError(category);

  // Create user-friendly message based on category
  let message = rawMessage;
  let userFriendly = false;

  switch (category) {
    case ErrorCategory.RATE_LIMIT:
      message =
        'You have made too many requests. Please wait a moment and try again.';
      userFriendly = true;
      break;

    case ErrorCategory.NETWORK:
      message =
        'Unable to connect to the server. Please check your internet connection.';
      userFriendly = true;
      break;

    case ErrorCategory.SERVICE_UNAVAILABLE:
      message =
        'The service is temporarily unavailable. This is usually temporary.';
      userFriendly = true;
      break;

    case ErrorCategory.AUTHENTICATION:
      message = 'Please connect your wallet to continue.';
      userFriendly = true;
      break;

    case ErrorCategory.VALIDATION:
      // Keep validation messages as-is, they're usually specific
      userFriendly = true;
      break;

    case ErrorCategory.NOT_FOUND:
      message = 'The requested item could not be found.';
      userFriendly = true;
      break;

    default:
      // For unknown errors, use the raw message but mark as not user-friendly
      message = rawMessage;
      userFriendly = false;
  }

  return {
    message,
    category,
    suggestion,
    userFriendly,
    originalError: error,
  };
}

/**
 * Format wallet connection errors
 */
export function formatWalletError(error: any): string {
  const message = getErrorMessage(error).toLowerCase();

  if (message.includes('user rejected') || message.includes('user denied')) {
    return 'Wallet connection was cancelled. Please try again when ready.';
  }

  if (message.includes('no wallet')) {
    return 'No Tezos wallet found. Please install Temple Wallet or Kukai.';
  }

  if (message.includes('network')) {
    return 'Unable to connect to Tezos network. Please check your connection.';
  }

  return 'Failed to connect wallet. Please try again.';
}

/**
 * Format contract operation errors
 */
export function formatContractError(error: any): string {
  const message = getErrorMessage(error).toLowerCase();

  if (message.includes('insufficient')) {
    return 'Insufficient funds to complete this transaction.';
  }

  if (message.includes('rejected')) {
    return 'Transaction was rejected. Please try again.';
  }

  if (message.includes('timeout')) {
    return 'Transaction timed out. It may still succeed. Check your wallet.';
  }

  if (message.includes('already exists')) {
    return 'This NFT already exists for your wallet.';
  }

  return 'Contract operation failed. Please try again.';
}

/**
 * Get retry delay message
 */
export function getRetryDelayMessage(seconds: number): string {
  if (seconds < 60) {
    return `Please wait ${seconds} second${seconds !== 1 ? 's' : ''}.`;
  }

  const minutes = Math.ceil(seconds / 60);
  return `Please wait ${minutes} minute${minutes !== 1 ? 's' : ''}.`;
}
