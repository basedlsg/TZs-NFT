/**
 * Tests for Input Validation
 *
 * Tests validation utilities for images, file sizes, and user inputs
 */

import { validateImage, validateReflection, validateGoalId } from '@/lib/validation';

describe('Image Validation', () => {
  describe('File Type Validation', () => {
    test('accepts valid JPEG image', () => {
      const file = new File(['fake-image-data'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImage(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('accepts valid PNG image', () => {
      const file = new File(['fake-image-data'], 'test.png', { type: 'image/png' });
      const result = validateImage(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('accepts valid WEBP image', () => {
      const file = new File(['fake-image-data'], 'test.webp', { type: 'image/webp' });
      const result = validateImage(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('rejects non-image file types', () => {
      const file = new File(['fake-data'], 'test.pdf', { type: 'application/pdf' });
      const result = validateImage(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an image');
    });

    test('rejects executable files', () => {
      const file = new File(['fake-data'], 'test.exe', { type: 'application/x-msdownload' });
      const result = validateImage(file);

      expect(result.valid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    test('rejects SVG files (potential XSS)', () => {
      const file = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
      const result = validateImage(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('SVG files are not allowed');
    });
  });

  describe('File Size Validation', () => {
    test('accepts file under 5MB limit', () => {
      const smallData = new Uint8Array(1024 * 1024 * 3); // 3MB
      const file = new File([smallData], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImage(file);

      expect(result.valid).toBe(true);
    });

    test('rejects file over 5MB limit', () => {
      const largeData = new Uint8Array(1024 * 1024 * 6); // 6MB
      const file = new File([largeData], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImage(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
      expect(result.error).toContain('5MB');
    });

    test('accepts file exactly at 5MB limit', () => {
      const data = new Uint8Array(1024 * 1024 * 5); // Exactly 5MB
      const file = new File([data], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImage(file);

      expect(result.valid).toBe(true);
    });

    test('rejects empty file', () => {
      const file = new File([], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImage(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });
  });

  describe('File Name Validation', () => {
    test('rejects files with suspicious extensions', () => {
      const file = new File(['data'], 'test.jpg.exe', { type: 'image/jpeg' });
      const result = validateImage(file);

      expect(result.valid).toBe(false);
    });

    test('handles files with no extension', () => {
      const file = new File(['data'], 'testfile', { type: 'image/jpeg' });
      const result = validateImage(file);

      // Should still validate based on MIME type
      expect(result.valid).toBe(true);
    });
  });
});

describe('Reflection Validation', () => {
  test('accepts valid reflection with sufficient length', () => {
    const reflection = 'This is a meaningful reflection about my progress and journey.';
    const result = validateReflection(reflection);

    expect(result.valid).toBe(true);
  });

  test('rejects reflection that is too short', () => {
    const reflection = 'Too short';
    const result = validateReflection(reflection);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 20 characters');
  });

  test('rejects empty reflection', () => {
    const reflection = '';
    const result = validateReflection(reflection);

    expect(result.valid).toBe(false);
  });

  test('rejects reflection with only whitespace', () => {
    const reflection = '     ';
    const result = validateReflection(reflection);

    expect(result.valid).toBe(false);
  });

  test('accepts reflection exactly at minimum length', () => {
    const reflection = '12345678901234567890'; // Exactly 20 chars
    const result = validateReflection(reflection);

    expect(result.valid).toBe(true);
  });

  test('rejects excessively long reflection', () => {
    const reflection = 'a'.repeat(5001); // Over 5000 char limit
    const result = validateReflection(reflection);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('too long');
  });

  test('detects potential spam patterns', () => {
    const reflection = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaa'; // Repetitive characters
    const result = validateReflection(reflection);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('spam');
  });
});

describe('Goal ID Validation', () => {
  test('accepts valid goal ID', () => {
    const goalId = 'daily-meditation';
    const result = validateGoalId(goalId);

    expect(result.valid).toBe(true);
  });

  test('accepts goal ID with numbers', () => {
    const goalId = 'workout-30-min';
    const result = validateGoalId(goalId);

    expect(result.valid).toBe(true);
  });

  test('rejects goal ID with special characters', () => {
    const goalId = 'goal@123!';
    const result = validateGoalId(goalId);

    expect(result.valid).toBe(false);
  });

  test('rejects goal ID that is too short', () => {
    const goalId = 'ab';
    const result = validateGoalId(goalId);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('at least 3 characters');
  });

  test('rejects goal ID that is too long', () => {
    const goalId = 'a'.repeat(51); // Over 50 char limit
    const result = validateGoalId(goalId);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('too long');
  });

  test('rejects empty goal ID', () => {
    const goalId = '';
    const result = validateGoalId(goalId);

    expect(result.valid).toBe(false);
  });

  test('accepts goal ID with underscores', () => {
    const goalId = 'daily_meditation_practice';
    const result = validateGoalId(goalId);

    expect(result.valid).toBe(true);
  });
});
