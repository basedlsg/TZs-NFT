/**
 * Input Validation Utilities
 *
 * Provides validation for images, text inputs, and user data
 * to prevent abuse and ensure data quality
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// Constants
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIN_REFLECTION_LENGTH = 20;
const MAX_REFLECTION_LENGTH = 5000;
const MIN_GOAL_ID_LENGTH = 3;
const MAX_GOAL_ID_LENGTH = 50;

/**
 * Validate image file
 *
 * Checks file type, size, and safety
 */
export function validateImage(file: File): ValidationResult {
  // Check if file exists and is not empty
  if (!file || file.size === 0) {
    return {
      valid: false,
      error: 'Image file is empty or missing',
    };
  }

  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `Image is too large. Maximum size is 5MB (${formatFileSize(MAX_IMAGE_SIZE)})`,
    };
  }

  // Reject SVG files first (potential XSS vector)
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return {
      valid: false,
      error: 'SVG files are not allowed for security reasons',
    };
  }

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File must be an image (JPEG, PNG, or WEBP)',
    };
  }

  // Check for double extensions (e.g., file.jpg.exe)
  const fileName = file.name.toLowerCase();
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.php', '.js', '.html'];

  for (const ext of suspiciousExtensions) {
    if (fileName.includes(ext)) {
      return {
        valid: false,
        error: 'Suspicious file name detected',
      };
    }
  }

  return { valid: true };
}

/**
 * Validate reflection text
 *
 * Checks length and detects potential spam
 */
export function validateReflection(reflection: string): ValidationResult {
  // Trim whitespace
  const trimmed = reflection.trim();

  // Check if empty
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Reflection cannot be empty',
    };
  }

  // Check minimum length
  if (trimmed.length < MIN_REFLECTION_LENGTH) {
    return {
      valid: false,
      error: `Reflection must be at least ${MIN_REFLECTION_LENGTH} characters`,
    };
  }

  // Check maximum length
  if (trimmed.length > MAX_REFLECTION_LENGTH) {
    return {
      valid: false,
      error: `Reflection is too long. Maximum length is ${MAX_REFLECTION_LENGTH} characters`,
    };
  }

  // Detect repetitive patterns (potential spam)
  if (isRepetitive(trimmed)) {
    return {
      valid: false,
      error: 'Reflection appears to contain spam or repetitive content',
    };
  }

  return { valid: true };
}

/**
 * Validate goal ID
 *
 * Ensures goal ID is safe and well-formed
 */
export function validateGoalId(goalId: string): ValidationResult {
  // Trim whitespace
  const trimmed = goalId.trim();

  // Check if empty
  if (trimmed.length === 0) {
    return {
      valid: false,
      error: 'Goal ID cannot be empty',
    };
  }

  // Check minimum length
  if (trimmed.length < MIN_GOAL_ID_LENGTH) {
    return {
      valid: false,
      error: `Goal ID must be at least ${MIN_GOAL_ID_LENGTH} characters`,
    };
  }

  // Check maximum length
  if (trimmed.length > MAX_GOAL_ID_LENGTH) {
    return {
      valid: false,
      error: `Goal ID is too long. Maximum length is ${MAX_GOAL_ID_LENGTH} characters`,
    };
  }

  // Check for valid characters (alphanumeric, hyphens, underscores only)
  const validPattern = /^[a-zA-Z0-9-_]+$/;
  if (!validPattern.test(trimmed)) {
    return {
      valid: false,
      error: 'Goal ID can only contain letters, numbers, hyphens, and underscores',
    };
  }

  return { valid: true };
}

/**
 * Helper: Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Helper: Detect repetitive content
 */
function isRepetitive(text: string): boolean {
  // Check for same character repeated
  const sameCharPattern = /(.)\1{19,}/; // Same char repeated 20+ times
  if (sameCharPattern.test(text)) {
    return true;
  }

  // Check for same word repeated
  const words = text.split(/\s+/);
  if (words.length >= 10) {
    const wordCounts = new Map<string, number>();

    for (const word of words) {
      const count = wordCounts.get(word) || 0;
      wordCounts.set(word, count + 1);

      // If any word appears more than 50% of the time, it's repetitive
      if (count > words.length * 0.5) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Validate data URL
 *
 * Ensures data URL is properly formatted and safe
 */
export function validateDataUrl(dataUrl: string): ValidationResult {
  if (!dataUrl || dataUrl.trim() === '') {
    return {
      valid: false,
      error: 'Data URL is empty',
    };
  }

  // Check if it starts with data:
  if (!dataUrl.startsWith('data:')) {
    return {
      valid: false,
      error: 'Invalid data URL format',
    };
  }

  // Check if it's an image
  const imagePattern = /^data:image\/(jpeg|png|webp);base64,/;
  if (!imagePattern.test(dataUrl)) {
    return {
      valid: false,
      error: 'Data URL must be a JPEG, PNG, or WEBP image',
    };
  }

  // Check size (approximate - base64 is ~33% larger than binary)
  const estimatedSize = (dataUrl.length * 3) / 4;
  if (estimatedSize > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: 'Image data is too large',
    };
  }

  return { valid: true };
}
