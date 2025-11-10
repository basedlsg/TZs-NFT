/**
 * Diary Storage Layer
 *
 * Stores encrypted diary entries in IndexedDB
 * All entries are encrypted before storage
 */

import {
  encryptAndSerialize,
  decryptSerialized,
  hashData,
  generateEntryId,
} from './encryption';
import { getMasterKey } from './keyManager';

const DB_NAME = 'pob-diary';
const DB_VERSION = 1;
const STORE_NAME = 'entries';

export interface DiaryEntry {
  id: string;
  goalId: string;
  reflection: string; // Decrypted
  imageDataUrl?: string; // Decrypted (base64)
  timestamp: number;
  hash?: string; // SHA-256 hash for on-chain commitment
}

interface EncryptedDiaryEntry {
  id: string;
  goalId: string;
  encryptedReflection: string; // Encrypted + serialized
  encryptedImage?: string; // Encrypted + serialized
  timestamp: number;
  hash: string;
}

/**
 * Open IndexedDB for diary storage
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });

        // Indexes for querying
        store.createIndex('goalId', 'goalId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Save diary entry (encrypts automatically)
 *
 * @param entry - Diary entry (plaintext)
 * @returns Entry ID
 */
export async function saveDiaryEntry(
  entry: Omit<DiaryEntry, 'id' | 'hash'>
): Promise<string> {
  const db = await openDatabase();
  const key = await getMasterKey();

  // Generate entry ID
  const id = entry.timestamp ? entry.timestamp.toString() : generateEntryId();

  // Encrypt reflection
  const encryptedReflection = await encryptAndSerialize(entry.reflection, key);

  // Encrypt image if present
  let encryptedImage: string | undefined;
  if (entry.imageDataUrl) {
    encryptedImage = await encryptAndSerialize(entry.imageDataUrl, key);
  }

  // Generate hash for on-chain commitment
  const hashInput = `${entry.goalId}:${entry.reflection}:${entry.timestamp}`;
  const hash = await hashData(hashInput);

  const encryptedEntry: EncryptedDiaryEntry = {
    id,
    goalId: entry.goalId,
    encryptedReflection,
    encryptedImage,
    timestamp: entry.timestamp,
    hash,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.put(encryptedEntry);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Retrieve diary entry by ID (decrypts automatically)
 *
 * @param id - Entry ID
 * @returns Decrypted diary entry or null
 */
export async function getDiaryEntry(id: string): Promise<DiaryEntry | null> {
  const db = await openDatabase();
  const key = await getMasterKey();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.get(id);

    request.onsuccess = async () => {
      const encryptedEntry = request.result as EncryptedDiaryEntry | undefined;

      if (!encryptedEntry) {
        resolve(null);
        return;
      }

      try {
        // Decrypt reflection
        const reflection = await decryptSerialized(
          encryptedEntry.encryptedReflection,
          key
        );

        // Decrypt image if present
        let imageDataUrl: string | undefined;
        if (encryptedEntry.encryptedImage) {
          imageDataUrl = await decryptSerialized(encryptedEntry.encryptedImage, key);
        }

        const entry: DiaryEntry = {
          id: encryptedEntry.id,
          goalId: encryptedEntry.goalId,
          reflection,
          imageDataUrl,
          timestamp: encryptedEntry.timestamp,
          hash: encryptedEntry.hash,
        };

        resolve(entry);
      } catch (error) {
        reject(new Error('Failed to decrypt entry: ' + error));
      }
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get all diary entries for a specific goal
 *
 * @param goalId - Goal identifier
 * @returns Array of decrypted entries
 */
export async function getDiaryEntriesByGoal(goalId: string): Promise<DiaryEntry[]> {
  const db = await openDatabase();
  const key = await getMasterKey();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('goalId');

    const request = index.getAll(goalId);

    request.onsuccess = async () => {
      const encryptedEntries = request.result as EncryptedDiaryEntry[];

      try {
        const decryptedEntries = await Promise.all(
          encryptedEntries.map(async (encryptedEntry) => {
            const reflection = await decryptSerialized(
              encryptedEntry.encryptedReflection,
              key
            );

            let imageDataUrl: string | undefined;
            if (encryptedEntry.encryptedImage) {
              imageDataUrl = await decryptSerialized(
                encryptedEntry.encryptedImage,
                key
              );
            }

            return {
              id: encryptedEntry.id,
              goalId: encryptedEntry.goalId,
              reflection,
              imageDataUrl,
              timestamp: encryptedEntry.timestamp,
              hash: encryptedEntry.hash,
            };
          })
        );

        resolve(decryptedEntries);
      } catch (error) {
        reject(new Error('Failed to decrypt entries: ' + error));
      }
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Get all diary entries (sorted by timestamp, newest first)
 *
 * @returns Array of decrypted entries
 */
export async function getAllDiaryEntries(): Promise<DiaryEntry[]> {
  const db = await openDatabase();
  const key = await getMasterKey();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = async () => {
      const encryptedEntries = request.result as EncryptedDiaryEntry[];

      try {
        const decryptedEntries = await Promise.all(
          encryptedEntries.map(async (encryptedEntry) => {
            const reflection = await decryptSerialized(
              encryptedEntry.encryptedReflection,
              key
            );

            let imageDataUrl: string | undefined;
            if (encryptedEntry.encryptedImage) {
              imageDataUrl = await decryptSerialized(
                encryptedEntry.encryptedImage,
                key
              );
            }

            return {
              id: encryptedEntry.id,
              goalId: encryptedEntry.goalId,
              reflection,
              imageDataUrl,
              timestamp: encryptedEntry.timestamp,
              hash: encryptedEntry.hash,
            };
          })
        );

        // Sort by timestamp (newest first)
        decryptedEntries.sort((a, b) => b.timestamp - a.timestamp);

        resolve(decryptedEntries);
      } catch (error) {
        reject(new Error('Failed to decrypt entries: ' + error));
      }
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Delete diary entry
 *
 * @param id - Entry ID
 */
export async function deleteDiaryEntry(id: string): Promise<void> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Clear all diary entries (dangerous - requires confirmation)
 */
export async function clearAllEntries(): Promise<void> {
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

/**
 * Export all diary entries (for backup)
 *
 * Returns encrypted entries (user must have key to decrypt)
 *
 * @returns JSON string of encrypted entries
 */
export async function exportDiary(): Promise<string> {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const request = store.getAll();

    request.onsuccess = () => {
      const entries = request.result;
      resolve(JSON.stringify(entries, null, 2));
    };

    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * Import diary entries from backup
 *
 * @param jsonData - JSON string of encrypted entries
 */
export async function importDiary(jsonData: string): Promise<void> {
  const db = await openDatabase();
  const entries = JSON.parse(jsonData) as EncryptedDiaryEntry[];

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    let errorOccurred = false;

    entries.forEach((entry) => {
      const request = store.put(entry);
      request.onerror = () => {
        errorOccurred = true;
      };
    });

    transaction.oncomplete = () => {
      db.close();
      if (errorOccurred) {
        reject(new Error('Some entries failed to import'));
      } else {
        resolve();
      }
    };

    transaction.onerror = () => reject(transaction.error);
  });
}
