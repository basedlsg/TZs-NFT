

# Client-Side Encryption Guide

Complete guide to the encryption architecture in Proof of Becoming.

---

## Overview

**Privacy Principle:** Your diary stays private. Only you can read it.

**Implementation:**
- **Algorithm:** AES-256-GCM (authenticated encryption)
- **Key Storage:** IndexedDB (browser-only, never transmitted)
- **Data Flow:** Encrypt on write, decrypt on read
- **On-Chain:** Only hash commitments, never plaintext

---

## Architecture

```
┌──────────────┐
│ User writes  │
│ diary entry  │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Generate/Get     │
│ Master Key       │ ← Stored in IndexedDB
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Encrypt with     │
│ AES-256-GCM      │ ← Random IV per entry
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Store encrypted  │
│ in IndexedDB     │ ← Local browser storage
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Optional: Pin    │
│ to IPFS          │ ← Only encrypted blob
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Store hash on    │
│ Tezos blockchain │ ← Commitment only
└──────────────────┘
```

---

## Encryption Primitives

### AES-256-GCM

**Why GCM mode?**
- ✅ **Authenticated encryption** (detects tampering)
- ✅ **Fast** (hardware acceleration in modern browsers)
- ✅ **Standard** (NIST recommended)
- ✅ **Native browser support** (Web Crypto API)

**Parameters:**
- Key size: 256 bits
- IV size: 96 bits (12 bytes)
- Tag size: 128 bits (default)

**Security Properties:**
- Confidentiality: Adversary cannot read plaintext
- Integrity: Adversary cannot modify ciphertext undetected
- Authenticity: Ensures data came from holder of key

---

## Key Management

### Master Key

**Generation:**
```typescript
import { generateEncryptionKey } from '@/lib/encryption';

const key = await generateEncryptionKey();
// CryptoKey: 256-bit AES-GCM
```

**Storage:**
```typescript
import { storeKey, getMasterKey } from '@/lib/keyManager';

// Store key in IndexedDB
await storeKey(key);

// Retrieve (or generate if doesn't exist)
const masterKey = await getMasterKey();
```

**Location:** IndexedDB (`pob-encryption` database, `keys` object store)

**Lifecycle:**
1. User first visit: Generate new key
2. Store in IndexedDB
3. Subsequent visits: Retrieve existing key
4. User can export for backup (manual action)
5. User can import from backup

### Key Export/Import (Backup)

**Export for Backup:**
```typescript
import { exportKeyForBackup } from '@/lib/keyManager';

const jwk = await exportKeyForBackup();
// Save JWK securely (user's password manager, encrypted file, etc.)
```

**Import from Backup:**
```typescript
import { importKeyFromBackup } from '@/lib/keyManager';

await importKeyFromBackup(jwk);
```

**Format:** JSON Web Key (JWK)
```json
{
  "kty": "oct",
  "k": "base64-encoded-key-material",
  "alg": "A256GCM",
  "ext": true
}
```

⚠️ **Security Warning:** JWK contains sensitive key material. Users must store backups securely.

---

## Encryption/Decryption Flow

### Encrypting Diary Entry

```typescript
import { getMasterKey } from '@/lib/keyManager';
import { encryptAndSerialize } from '@/lib/encryption';

const key = await getMasterKey();
const plaintext = "I ran 5km today!";

const encrypted = await encryptAndSerialize(plaintext, key);
// Format: "base64(IV):base64(ciphertext)"
```

**Steps:**
1. Generate random 96-bit IV
2. Encode plaintext to UTF-8 bytes
3. Encrypt with AES-GCM (key + IV)
4. Serialize: `base64(IV):base64(ciphertext)`

### Decrypting Diary Entry

```typescript
import { getMasterKey } from '@/lib/keyManager';
import { decryptSerialized } from '@/lib/encryption';

const key = await getMasterKey();
const encrypted = "abc123...:def456...";

const plaintext = await decryptSerialized(encrypted, key);
// "I ran 5km today!"
```

**Steps:**
1. Parse serialized string (split on `:`)
2. Decode base64 to get IV and ciphertext
3. Decrypt with AES-GCM (key + IV)
4. Decode bytes to UTF-8 string

---

## Diary Storage

### Saving Entry

```typescript
import { saveDiaryEntry } from '@/lib/diaryStorage';

const entry = {
  goalId: 'run_5km',
  reflection: 'I ran 5km today! Felt great.',
  imageDataUrl: 'data:image/png;base64,...',
  timestamp: Date.now(),
};

const entryId = await saveDiaryEntry(entry);
```

**What Happens:**
1. Get/generate master key
2. Encrypt reflection text
3. Encrypt image (if present)
4. Generate hash for on-chain commitment
5. Store encrypted data in IndexedDB

**Stored Format:**
```typescript
{
  id: '1699999999999',
  goalId: 'run_5km',
  encryptedReflection: 'iv:ciphertext',
  encryptedImage: 'iv:ciphertext',
  timestamp: 1699999999999,
  hash: 'sha256-hex-string'
}
```

### Retrieving Entry

```typescript
import { getDiaryEntry } from '@/lib/diaryStorage';

const entry = await getDiaryEntry(entryId);
// {
//   id: '...',
//   goalId: 'run_5km',
//   reflection: 'I ran 5km today!',  // Decrypted!
//   imageDataUrl: 'data:image/png;base64,...',  // Decrypted!
//   timestamp: 1699999999999,
//   hash: 'sha256...'
// }
```

**What Happens:**
1. Retrieve encrypted entry from IndexedDB
2. Get master key
3. Decrypt reflection
4. Decrypt image (if present)
5. Return plaintext entry

---

## On-Chain Commitments

**Privacy Goal:** Prove diary entry exists without revealing content.

**Implementation:**
```typescript
import { hashData } from '@/lib/encryption';

const hashInput = `${goalId}:${reflection}:${timestamp}`;
const hash = await hashData(hashInput);
// SHA-256 hex string: 'a1b2c3d4...'
```

**On-Chain Storage:**
- Only the hash is stored in Soul-NFT metadata
- Original data never leaves the client
- Verifiable: User can prove they have the original by providing it

**Use Case:**
- Evolve NFT on-chain with hash commitment
- Off-chain: Keep encrypted diary in IndexedDB or IPFS
- Anyone can verify hash matches without seeing diary

---

## Security Properties

### Confidentiality ✅

**Threat:** Adversary reads diary content

**Mitigation:**
- AES-256-GCM encryption (industry standard)
- 256-bit key space (2^256 combinations)
- Random IV per encryption (prevents pattern analysis)

**Result:** Computationally infeasible to decrypt without key

### Integrity ✅

**Threat:** Adversary modifies encrypted diary

**Mitigation:**
- GCM mode provides authentication tag
- Decryption fails if ciphertext tampered

**Result:** Any modification detected and rejected

### Key Security ✅

**Threat:** Key leakage or theft

**Mitigations:**
- Keys never transmitted over network
- Stored only in browser's IndexedDB
- IndexedDB isolated per origin (cannot be read by other sites)
- User can backup key (encrypted with password)

**Result:** Key only accessible to user's browser

---

## Threat Model

### In-Scope Threats

1. **Network Eavesdropping**
   - ✅ Encrypted data only transmitted (IPFS pins)
   - ✅ Keys never transmitted

2. **Server Compromise**
   - ✅ Server never sees plaintext or keys
   - ✅ Only encrypted blobs on IPFS

3. **On-Chain Analysis**
   - ✅ Only hashes on-chain
   - ✅ No correlation to encrypted data

4. **Browser Storage Read**
   - ✅ IndexedDB isolated per origin
   - ❌ User with device access CAN read (expected)

### Out-of-Scope Threats

1. **Physical device access** - User's browser has plaintext when decrypted
2. **Browser vulnerabilities** - XSS could read data (mitigate with CSP)
3. **Keyloggers/malware** - Can capture plaintext as typed
4. **User losing key** - Irrecoverable without backup (feature, not bug)

### Future Enhancements

- [ ] **Password-derived key encryption** (encrypt master key with user password)
- [ ] **Key rotation** (re-encrypt old entries with new key)
- [ ] **Multi-device sync** (encrypted key sync via cloud)
- [ ] **Hardware security** (WebAuthn for key access)

---

## Best Practices

### For Users

1. **Backup your key**
   - Export JWK from Settings
   - Store in password manager or encrypted file
   - Without key, diary is irrecoverable

2. **Use HTTPS only**
   - Web Crypto API requires secure context
   - Never use on HTTP sites

3. **Keep device secure**
   - Use device encryption (FileVault, BitLocker)
   - Lock screen when away

4. **Beware of browser extensions**
   - Extensions can access page context
   - Use trusted extensions only

### For Developers

1. **Never log keys or plaintext**
   - Use console.debug only, strip in production
   - No analytics on sensitive data

2. **Validate all inputs**
   - Check IV length (12 bytes)
   - Verify ciphertext format

3. **Handle errors gracefully**
   - Decryption failure = wrong key or corrupted data
   - Don't leak information in error messages

4. **Test edge cases**
   - Empty strings
   - Very large files (images)
   - Concurrent encryptions

---

## API Reference

### Encryption Functions

```typescript
// Generate key
generateEncryptionKey(): Promise<CryptoKey>

// Encrypt
encryptData(plaintext: string, key: CryptoKey): Promise<EncryptedData>
encryptAndSerialize(plaintext: string, key: CryptoKey): Promise<string>

// Decrypt
decryptData(iv: Uint8Array, ciphertext: Uint8Array, key: CryptoKey): Promise<string>
decryptSerialized(serialized: string, key: CryptoKey): Promise<string>

// Hash
hashData(data: string): Promise<string>

// Utilities
uint8ArrayToBase64(data: Uint8Array): string
base64ToUint8Array(base64: string): Uint8Array
generateEntryId(): string
```

### Key Management

```typescript
// Key lifecycle
getMasterKey(): Promise<CryptoKey>
storeKey(key: CryptoKey, keyId?: string): Promise<void>
retrieveKey(keyId?: string): Promise<CryptoKey | null>
hasKey(keyId?: string): Promise<boolean>
deleteKey(keyId?: string): Promise<void>

// Backup
exportKeyForBackup(keyId?: string): Promise<JsonWebKey | null>
importKeyFromBackup(jwk: JsonWebKey, keyId?: string): Promise<void>

// Danger zone
clearAllKeys(): Promise<void>
```

### Diary Storage

```typescript
// CRUD operations
saveDiaryEntry(entry: Omit<DiaryEntry, 'id' | 'hash'>): Promise<string>
getDiaryEntry(id: string): Promise<DiaryEntry | null>
getDiaryEntriesByGoal(goalId: string): Promise<DiaryEntry[]>
getAllDiaryEntries(): Promise<DiaryEntry[]>
deleteDiaryEntry(id: string): Promise<void>

// Backup
exportDiary(): Promise<string>
importDiary(jsonData: string): Promise<void>

// Danger zone
clearAllEntries(): Promise<void>
```

---

## Testing

### Unit Tests

```bash
cd frontend
npm test -- encryption.test.ts
```

**Coverage:**
- Key generation
- Encryption/decryption round-trip
- Serialization/deserialization
- Error handling (wrong key, corrupted data)
- Base64 encoding utilities

### Manual Testing

```typescript
// In browser console (DevTools)
import { getMasterKey, saveDiaryEntry, getDiaryEntry } from '@/lib/diaryStorage';

// Save entry
const id = await saveDiaryEntry({
  goalId: 'test',
  reflection: 'This is a test',
  timestamp: Date.now()
});

// Retrieve entry
const entry = await getDiaryEntry(id);
console.log(entry.reflection); // "This is a test"
```

---

## Troubleshooting

### "QuotaExceededError"
**Cause:** IndexedDB storage limit reached
**Solution:** Delete old entries or clear diary

### "Decryption failed"
**Cause:** Wrong key or corrupted data
**Solution:** Verify key matches original encryption key; restore from backup

### "Web Crypto API not available"
**Cause:** Not using HTTPS or old browser
**Solution:** Use HTTPS; update browser to latest version

### "Operation failed"
**Cause:** Browser doesn't support Web Crypto API
**Solution:** Use modern browser (Chrome 60+, Firefox 75+, Safari 14+)

---

## References

- [Web Crypto API Spec](https://www.w3.org/TR/WebCryptoAPI/)
- [AES-GCM NIST Recommendation](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)

---

**Privacy is a feature, not an afterthought.** 🔐
