/**
 * IPFS Integration for Frontend
 *
 * Provides utilities to pin encrypted diary data to IPFS via backend API
 * Retrieves and decrypts data from IPFS
 *
 * Privacy: All data is encrypted client-side before pinning
 */

import { encryptAndSerialize, decryptSerialized } from './encryption';
import { getMasterKey } from './keyManager';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface IPFSPinResult {
  cid: string;
  uri: string;
  size: number;
}

export interface IPFSRetrieveResult {
  data: string; // Encrypted data (base64)
  size: number;
}

/**
 * Check if IPFS is available via backend
 *
 * @returns True if IPFS node is available
 */
export async function isIPFSAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/ipfs/health`);
    if (!response.ok) return false;

    const data = await response.json();
    return data.ipfs_available === true;
  } catch (error) {
    console.error('IPFS health check failed:', error);
    return false;
  }
}

/**
 * Pin encrypted data to IPFS
 *
 * Data is encrypted client-side before sending to backend
 *
 * @param plaintext - Data to encrypt and pin
 * @param metadata - Optional metadata (not encrypted)
 * @returns IPFS CID and URI
 */
export async function pinToIPFS(
  plaintext: string,
  metadata?: Record<string, unknown>
): Promise<IPFSPinResult> {
  // Encrypt data client-side
  const key = await getMasterKey();
  const encrypted = await encryptAndSerialize(plaintext, key);

  // Send encrypted data to backend
  const response = await fetch(`${API_URL}/api/ipfs/pin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: btoa(encrypted), // Base64 encode for transport
      metadata,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to pin to IPFS');
  }

  const result: IPFSPinResult = await response.json();
  return result;
}

/**
 * Retrieve and decrypt data from IPFS
 *
 * @param cid - IPFS Content Identifier
 * @returns Decrypted plaintext
 */
export async function retrieveFromIPFS(cid: string): Promise<string> {
  // Retrieve encrypted data from backend
  const response = await fetch(`${API_URL}/api/ipfs/${cid}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Data not found on IPFS');
    }
    const error = await response.json();
    throw new Error(error.detail || 'Failed to retrieve from IPFS');
  }

  const result: IPFSRetrieveResult = await response.json();

  // Decode base64
  const encrypted = atob(result.data);

  // Decrypt client-side
  const key = await getMasterKey();
  const plaintext = await decryptSerialized(encrypted, key);

  return plaintext;
}

/**
 * Pin diary entry to IPFS
 *
 * Convenience function that encrypts and pins a complete diary entry
 *
 * @param entry - Diary entry object
 * @returns IPFS URI
 */
export async function pinDiaryEntry(entry: {
  goalId: string;
  reflection: string;
  imageDataUrl?: string;
  timestamp: number;
}): Promise<string> {
  // Serialize entry to JSON
  const entryJSON = JSON.stringify(entry);

  // Pin to IPFS
  const result = await pinToIPFS(entryJSON, {
    goalId: entry.goalId,
    timestamp: entry.timestamp,
  });

  return result.uri;
}

/**
 * Retrieve diary entry from IPFS
 *
 * @param cid - IPFS Content Identifier
 * @returns Decrypted diary entry
 */
export async function retrieveDiaryEntry(cid: string): Promise<{
  goalId: string;
  reflection: string;
  imageDataUrl?: string;
  timestamp: number;
}> {
  // Retrieve and decrypt
  const plaintext = await retrieveFromIPFS(cid);

  // Parse JSON
  const entry = JSON.parse(plaintext);

  return entry;
}

/**
 * Convert IPFS URI to CID
 *
 * @param uri - IPFS URI (ipfs://...)
 * @returns CID
 */
export function uriToCID(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    return uri.substring(7); // Remove 'ipfs://' prefix
  }
  return uri;
}

/**
 * Convert CID to IPFS URI
 *
 * @param cid - IPFS Content Identifier
 * @returns IPFS URI
 */
export function cidToURI(cid: string): string {
  if (cid.startsWith('ipfs://')) {
    return cid;
  }
  return `ipfs://${cid}`;
}

/**
 * Get IPFS gateway URL for CID
 *
 * @param cid - IPFS Content Identifier
 * @param gateway - Gateway URL (default: ipfs.io)
 * @returns Full gateway URL
 */
export function getGatewayURL(
  cid: string,
  gateway: string = 'https://ipfs.io/ipfs/'
): string {
  const actualCID = uriToCID(cid);
  return `${gateway}${actualCID}`;
}
