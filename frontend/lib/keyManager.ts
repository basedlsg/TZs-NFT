/**
 * Encryption Key Management
 *
 * Stores encryption keys in IndexedDB (browser-only storage)
 * Keys never leave the client
 *
 * Security: Keys are stored as non-extractable where possible
 */

import {
  generateEncryptionKey,
  exportKey,
  importKey,
} from './encryption';

const DB_NAME = 'pob-encryption';
const DB_VERSION = 1;
const STORE_NAME = 'keys';
const MASTER_KEY_ID = 'master-encryption-key';

/**
 * Initialize IndexedDB for key storage
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object store for keys
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Store encryption key in IndexedDB
 *
 * @param key - CryptoKey to store
 * @param keyId - Identifier for the key (default: master key)
 */
export async function storeKey(
  key: CryptoKey,
  keyId: string = MASTER_KEY_ID
): Promise<void> {
  const db = await openDatabase();

  // Export key to JWK for storage
  const jwk = await exportKey(key);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.put(jwk, keyId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Retrieve encryption key from IndexedDB
 *
 * @param keyId - Identifier for the key
 * @returns CryptoKey or null if not found
 */
export async function retrieveKey(
  keyId: string = MASTER_KEY_ID
): Promise<CryptoKey | null> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(keyId);

    request.onsuccess = async () => {
      const jwk = request.result as JsonWebKey | undefined;

      if (!jwk) {
        resolve(null);
      } else {
        try {
          const key = await importKey(jwk);
          resolve(key);
        } catch (error) {
          reject(error);
        }
      }
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Check if encryption key exists
 *
 * @param keyId - Identifier for the key
 * @returns True if key exists
 */
export async function hasKey(keyId: string = MASTER_KEY_ID): Promise<boolean> {
  const key = await retrieveKey(keyId);
  return key !== null;
}

/**
 * Delete encryption key
 *
 * @param keyId - Identifier for the key
 */
export async function deleteKey(keyId: string = MASTER_KEY_ID): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(keyId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get or create master encryption key
 *
 * If no key exists, generates and stores a new one
 *
 * @returns Master encryption key
 */
export async function getMasterKey(): Promise<CryptoKey> {
  // Try to retrieve existing key
  let key = await retrieveKey(MASTER_KEY_ID);

  // If no key exists, generate and store new one
  if (!key) {
    key = await generateEncryptionKey();
    await storeKey(key, MASTER_KEY_ID);
  }

  return key;
}

/**
 * Export key for backup (user-initiated only)
 *
 * Returns JWK that user can save securely
 *
 * @param keyId - Identifier for the key
 * @returns JWK object
 */
export async function exportKeyForBackup(
  keyId: string = MASTER_KEY_ID
): Promise<JsonWebKey | null> {
  const key = await retrieveKey(keyId);

  if (!key) {
    return null;
  }

  return exportKey(key);
}

/**
 * Import key from backup
 *
 * @param jwk - JSON Web Key
 * @param keyId - Identifier to store under
 */
export async function importKeyFromBackup(
  jwk: JsonWebKey,
  keyId: string = MASTER_KEY_ID
): Promise<void> {
  const key = await importKey(jwk);
  await storeKey(key, keyId);
}

/**
 * Clear all encryption keys (dangerous - user confirmation required)
 */
export async function clearAllKeys(): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}
