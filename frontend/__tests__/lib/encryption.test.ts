/**
 * Tests for client-side encryption utilities
 * Test-first approach for AES-GCM encryption with Web Crypto API
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock Web Crypto API for Node.js environment
const mockCrypto = {
  subtle: {
    generateKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    exportKey: jest.fn(),
    importKey: jest.fn(),
  },
  getRandomValues: jest.fn((arr) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = Math.floor(Math.random() * 256);
    }
    return arr;
  }),
};

global.crypto = mockCrypto as any;

describe('Encryption Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateEncryptionKey()', () => {
    it('should generate a 256-bit AES-GCM key', async () => {
      const { generateEncryptionKey } = await import('@/lib/encryption');

      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } };
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);

      const key = await generateEncryptionKey();

      expect(mockCrypto.subtle.generateKey).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );

      expect(key).toBeDefined();
    });
  });

  describe('encryptData()', () => {
    it('should encrypt plaintext and return IV + ciphertext', async () => {
      const { encryptData } = await import('@/lib/encryption');

      const plaintext = 'This is my private diary entry';
      const mockKey = { type: 'secret' };

      const mockEncrypted = new Uint8Array([1, 2, 3, 4, 5]);
      mockCrypto.subtle.encrypt.mockResolvedValue(mockEncrypted.buffer);

      const result = await encryptData(plaintext, mockKey as CryptoKey);

      expect(result).toHaveProperty('iv');
      expect(result).toHaveProperty('ciphertext');
      expect(result.iv).toBeInstanceOf(Uint8Array);
      expect(result.iv.length).toBe(12); // 96-bit IV for AES-GCM
      expect(result.ciphertext).toBeInstanceOf(Uint8Array);
    });

    it('should use unique IV for each encryption', async () => {
      const { encryptData } = await import('@/lib/encryption');

      const mockKey = { type: 'secret' };
      mockCrypto.subtle.encrypt.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

      const result1 = await encryptData('test1', mockKey as CryptoKey);
      const result2 = await encryptData('test2', mockKey as CryptoKey);

      // IVs should be different
      expect(result1.iv).not.toEqual(result2.iv);
    });

    it('should throw error for empty plaintext', async () => {
      const { encryptData } = await import('@/lib/encryption');

      const mockKey = { type: 'secret' };

      await expect(encryptData('', mockKey as CryptoKey)).rejects.toThrow(
        'Plaintext cannot be empty'
      );
    });
  });

  describe('decryptData()', () => {
    it('should decrypt ciphertext with IV and key', async () => {
      const { decryptData } = await import('@/lib/encryption');

      const iv = new Uint8Array(12);
      const ciphertext = new Uint8Array([1, 2, 3, 4, 5]);
      const mockKey = { type: 'secret' };

      const originalText = 'This is my private diary';
      const encoder = new TextEncoder();
      const mockDecrypted = encoder.encode(originalText);

      mockCrypto.subtle.decrypt.mockResolvedValue(mockDecrypted.buffer);

      const result = await decryptData(iv, ciphertext, mockKey as CryptoKey);

      expect(mockCrypto.subtle.decrypt).toHaveBeenCalledWith(
        {
          name: 'AES-GCM',
          iv,
        },
        mockKey,
        ciphertext
      );

      expect(result).toBe(originalText);
    });

    it('should throw error if decryption fails', async () => {
      const { decryptData } = await import('@/lib/encryption');

      const iv = new Uint8Array(12);
      const ciphertext = new Uint8Array([1, 2, 3]);
      const mockKey = { type: 'secret' };

      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'));

      await expect(decryptData(iv, ciphertext, mockKey as CryptoKey)).rejects.toThrow(
        'Decryption failed'
      );
    });
  });

  describe('exportKey()', () => {
    it('should export key to JWK format', async () => {
      const { exportKey } = await import('@/lib/encryption');

      const mockKey = { type: 'secret' };
      const mockJWK = {
        kty: 'oct',
        k: 'base64encodedkey',
        alg: 'A256GCM',
        ext: true,
      };

      mockCrypto.subtle.exportKey.mockResolvedValue(mockJWK);

      const result = await exportKey(mockKey as CryptoKey);

      expect(mockCrypto.subtle.exportKey).toHaveBeenCalledWith('jwk', mockKey);
      expect(result).toEqual(mockJWK);
    });
  });

  describe('importKey()', () => {
    it('should import key from JWK format', async () => {
      const { importKey } = await import('@/lib/encryption');

      const mockJWK = {
        kty: 'oct',
        k: 'base64encodedkey',
        alg: 'A256GCM',
        ext: true,
      };

      const mockKey = { type: 'secret', algorithm: { name: 'AES-GCM' } };
      mockCrypto.subtle.importKey.mockResolvedValue(mockKey);

      const result = await importKey(mockJWK);

      expect(mockCrypto.subtle.importKey).toHaveBeenCalledWith(
        'jwk',
        mockJWK,
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );

      expect(result).toBeDefined();
    });
  });

  describe('Round-trip encryption/decryption', () => {
    it('should encrypt and decrypt to original plaintext', async () => {
      const { generateEncryptionKey, encryptData, decryptData } = await import(
        '@/lib/encryption'
      );

      const originalText = 'This is a secret diary entry!';

      // Mock key generation
      const mockKey = { type: 'secret' };
      mockCrypto.subtle.generateKey.mockResolvedValue(mockKey);

      // Mock encryption
      const encoder = new TextEncoder();
      const encodedText = encoder.encode(originalText);
      mockCrypto.subtle.encrypt.mockResolvedValue(encodedText.buffer);

      // Mock decryption
      mockCrypto.subtle.decrypt.mockResolvedValue(encodedText.buffer);

      const key = await generateEncryptionKey();
      const encrypted = await encryptData(originalText, key as CryptoKey);
      const decrypted = await decryptData(
        encrypted.iv,
        encrypted.ciphertext,
        key as CryptoKey
      );

      expect(decrypted).toBe(originalText);
    });
  });

  describe('Base64 encoding utilities', () => {
    it('should convert Uint8Array to base64 string', () => {
      const { uint8ArrayToBase64 } = require('@/lib/encryption');

      const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const base64 = uint8ArrayToBase64(data);

      expect(typeof base64).toBe('string');
      expect(base64.length).toBeGreaterThan(0);
    });

    it('should convert base64 string back to Uint8Array', () => {
      const { base64ToUint8Array, uint8ArrayToBase64 } = require('@/lib/encryption');

      const original = new Uint8Array([72, 101, 108, 108, 111]);
      const base64 = uint8ArrayToBase64(original);
      const recovered = base64ToUint8Array(base64);

      expect(recovered).toEqual(original);
    });
  });

  describe('Combined encrypt/decrypt with serialization', () => {
    it('should serialize encrypted data for storage', async () => {
      const { encryptAndSerialize } = await import('@/lib/encryption');

      const plaintext = 'Private diary entry';
      const mockKey = { type: 'secret' };

      mockCrypto.subtle.encrypt.mockResolvedValue(new Uint8Array([1, 2, 3]).buffer);

      const serialized = await encryptAndSerialize(plaintext, mockKey as CryptoKey);

      expect(typeof serialized).toBe('string');
      expect(serialized).toContain(':'); // IV:ciphertext format
    });

    it('should deserialize and decrypt serialized data', async () => {
      const { encryptAndSerialize, decryptSerialized } = await import('@/lib/encryption');

      const originalText = 'Secret message';
      const mockKey = { type: 'secret' };

      const encoder = new TextEncoder();
      const encodedText = encoder.encode(originalText);

      mockCrypto.subtle.encrypt.mockResolvedValue(encodedText.buffer);
      mockCrypto.subtle.decrypt.mockResolvedValue(encodedText.buffer);

      const serialized = await encryptAndSerialize(originalText, mockKey as CryptoKey);
      const decrypted = await decryptSerialized(serialized, mockKey as CryptoKey);

      expect(decrypted).toBe(originalText);
    });
  });
});
