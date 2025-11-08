/**
 * Client-Side Encryption Utilities
 *
 * Uses Web Crypto API for AES-GCM encryption
 * Keys never leave the client - stored in IndexedDB
 *
 * Security: AES-256-GCM with 96-bit IV
 */

// Encrypted data structure
export interface EncryptedData {
  iv: Uint8Array;
  ciphertext: Uint8Array;
}

/**
 * Generate a new AES-GCM encryption key (256-bit)
 *
 * @returns CryptoKey for encryption/decryption
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256, // 256-bit key
    },
    true, // extractable (for export/backup)
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt plaintext data using AES-GCM
 *
 * @param plaintext - String to encrypt
 * @param key - Encryption key
 * @returns Encrypted data with IV and ciphertext
 */
export async function encryptData(
  plaintext: string,
  key: CryptoKey
): Promise<EncryptedData> {
  if (!plaintext || plaintext.length === 0) {
    throw new Error('Plaintext cannot be empty');
  }

  // Generate random IV (96 bits / 12 bytes for AES-GCM)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encode plaintext to Uint8Array
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Encrypt
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    plaintextBytes
  );

  const ciphertext = new Uint8Array(ciphertextBuffer);

  return {
    iv,
    ciphertext,
  };
}

/**
 * Decrypt ciphertext using AES-GCM
 *
 * @param iv - Initialization vector
 * @param ciphertext - Encrypted data
 * @param key - Decryption key
 * @returns Decrypted plaintext string
 */
export async function decryptData(
  iv: Uint8Array,
  ciphertext: Uint8Array,
  key: CryptoKey
): Promise<string> {
  try {
    const plaintextBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    );

    const decoder = new TextDecoder();
    const plaintext = decoder.decode(plaintextBuffer);

    return plaintext;
  } catch (error) {
    throw new Error('Decryption failed: invalid key or corrupted data');
  }
}

/**
 * Export encryption key to JWK format (for storage/backup)
 *
 * @param key - CryptoKey to export
 * @returns JWK representation
 */
export async function exportKey(key: CryptoKey): Promise<JsonWebKey> {
  const jwk = await crypto.subtle.exportKey('jwk', key);
  return jwk;
}

/**
 * Import encryption key from JWK format
 *
 * @param jwk - JSON Web Key
 * @returns CryptoKey for encryption/decryption
 */
export async function importKey(jwk: JsonWebKey): Promise<CryptoKey> {
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Convert Uint8Array to base64 string
 *
 * @param data - Uint8Array
 * @returns Base64 string
 */
export function uint8ArrayToBase64(data: Uint8Array): string {
  let binary = '';
  const len = data.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 *
 * @param base64 - Base64 string
 * @returns Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Encrypt data and serialize to string for storage
 *
 * Format: base64(IV):base64(ciphertext)
 *
 * @param plaintext - Data to encrypt
 * @param key - Encryption key
 * @returns Serialized encrypted string
 */
export async function encryptAndSerialize(
  plaintext: string,
  key: CryptoKey
): Promise<string> {
  const encrypted = await encryptData(plaintext, key);

  const ivBase64 = uint8ArrayToBase64(encrypted.iv);
  const ciphertextBase64 = uint8ArrayToBase64(encrypted.ciphertext);

  return `${ivBase64}:${ciphertextBase64}`;
}

/**
 * Deserialize and decrypt encrypted string
 *
 * @param serialized - Serialized encrypted data (IV:ciphertext)
 * @param key - Decryption key
 * @returns Decrypted plaintext
 */
export async function decryptSerialized(
  serialized: string,
  key: CryptoKey
): Promise<string> {
  const [ivBase64, ciphertextBase64] = serialized.split(':');

  if (!ivBase64 || !ciphertextBase64) {
    throw new Error('Invalid serialized format');
  }

  const iv = base64ToUint8Array(ivBase64);
  const ciphertext = base64ToUint8Array(ciphertextBase64);

  return decryptData(iv, ciphertext, key);
}

/**
 * Hash data using SHA-256 (for on-chain commitments)
 *
 * @param data - Data to hash
 * @returns Hex string of hash
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Generate random ID for diary entries
 *
 * @returns Random hex string (128-bit)
 */
export function generateEntryId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
