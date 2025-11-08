# IPFS Integration Guide

Complete guide to IPFS integration in Proof of Becoming.

---

## Overview

**Purpose:** Optional decentralized storage for encrypted diary entries.

**Privacy Principle:** Only encrypted data is pinned to IPFS. Plaintext never leaves your browser.

**Implementation:**
- **Backend:** FastAPI proxy to IPFS HTTP API
- **Frontend:** Client-side encryption before pinning
- **Storage:** Encrypted blobs on IPFS, keys in browser IndexedDB
- **Retrieval:** Fetch from IPFS, decrypt client-side

---

## Architecture

```
┌──────────────────┐
│ User writes      │
│ diary entry      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Encrypt with     │
│ AES-256-GCM      │ ← Master key from IndexedDB
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Base64 encode    │
│ encrypted data   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ POST to backend  │
│ /api/ipfs/pin    │ ← Only encrypted blob sent
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Backend pins to  │
│ IPFS node        │ ← via HTTP API
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Returns CID      │
│ (ipfs://...)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Store CID in     │
│ IndexedDB or     │
│ on-chain         │
└──────────────────┘
```

**Retrieval Flow:**
```
User requests entry → GET /api/ipfs/{cid} → Backend fetches from IPFS
→ Returns encrypted base64 → Frontend decrypts client-side → Plaintext
```

---

## Why IPFS?

### Benefits

1. **Decentralized Storage**
   - No single point of failure
   - Censorship-resistant
   - Content-addressed (tamper-proof)

2. **Privacy-Preserving**
   - Only encrypted data on IPFS
   - No plaintext leakage
   - Compatible with client-side encryption

3. **Permanent Storage**
   - Pinned data persists indefinitely
   - Accessible via any IPFS gateway
   - User controls their data

4. **Backup & Recovery**
   - CID can be stored on-chain
   - Multiple gateways for retrieval
   - Export/import via CID

### Trade-offs

❌ **Not Required:** Users can use local IndexedDB only
❌ **Cost:** Pinning services may charge for storage
❌ **Latency:** Slower than local storage
❌ **Public Network:** Even encrypted, metadata is visible (file size, access patterns)

---

## Backend API

### Environment Setup

**IPFS Node Configuration:**

```bash
# .env file
IPFS_API_URL=http://127.0.0.1:5001  # Local IPFS node
# OR
IPFS_API_URL=https://ipfs.infura.io:5001  # Infura IPFS
# OR
IPFS_API_URL=https://api.pinata.cloud  # Pinata
```

**Local IPFS Node (Recommended for Development):**

```bash
# Install IPFS Desktop or Kubo CLI
# https://docs.ipfs.tech/install/

# Start IPFS daemon
ipfs daemon

# Verify it's running
curl http://127.0.0.1:5001/api/v0/version
```

**Infura IPFS (Production):**

```bash
# Sign up at https://infura.io
# Create IPFS project
# Get project ID and secret

IPFS_API_URL=https://ipfs.infura.io:5001
IPFS_PROJECT_ID=your_project_id
IPFS_PROJECT_SECRET=your_secret
```

### Endpoints

#### POST /api/ipfs/pin

Pin encrypted data to IPFS.

**Request:**
```json
{
  "data": "base64-encoded-encrypted-data",
  "metadata": {
    "goalId": "run_5km",
    "timestamp": 1699999999999
  }
}
```

**Response:**
```json
{
  "cid": "QmXyz123...",
  "uri": "ipfs://QmXyz123...",
  "size": 2048
}
```

**Validation:**
- `data` must be valid base64
- Max size: 10 MB
- Returns 400 if validation fails
- Returns 502 if IPFS node unavailable

**Example:**
```bash
curl -X POST http://localhost:8000/api/ipfs/pin \
  -H "Content-Type: application/json" \
  -d '{
    "data": "aGVsbG8gd29ybGQ=",
    "metadata": {"goalId": "test"}
  }'
```

#### GET /api/ipfs/{cid}

Retrieve data from IPFS by CID.

**Response:**
```json
{
  "data": "base64-encoded-encrypted-data",
  "size": 2048
}
```

**Errors:**
- 404 if CID not found on IPFS
- 502 if IPFS node unavailable

**Example:**
```bash
curl http://localhost:8000/api/ipfs/QmXyz123...
```

#### GET /api/ipfs/health

Check if IPFS node is available.

**Response:**
```json
{
  "status": "ok",
  "ipfs_available": true,
  "ipfs_version": "0.20.0"
}
```

**Example:**
```bash
curl http://localhost:8000/api/ipfs/health
```

---

## Frontend API

### Checking Availability

```typescript
import { isIPFSAvailable } from '@/lib/ipfs';

const available = await isIPFSAvailable();
if (!available) {
  console.warn('IPFS not available, using local storage only');
}
```

### Pinning Diary Entry

**Basic Usage:**
```typescript
import { pinDiaryEntry } from '@/lib/ipfs';

const entry = {
  goalId: 'run_5km',
  reflection: 'I ran 5km today! Felt great.',
  imageDataUrl: 'data:image/png;base64,...',
  timestamp: Date.now(),
};

try {
  const ipfsUri = await pinDiaryEntry(entry);
  console.log('Pinned to IPFS:', ipfsUri);
  // ipfs://QmXyz123...
} catch (error) {
  console.error('Failed to pin:', error);
  // Fall back to local storage only
}
```

**Low-Level API:**
```typescript
import { pinToIPFS } from '@/lib/ipfs';

const plaintext = 'My private diary entry';

const result = await pinToIPFS(plaintext, {
  goalId: 'run_5km',
  timestamp: Date.now(),
});

console.log('CID:', result.cid);
console.log('URI:', result.uri);
console.log('Size:', result.size);
```

### Retrieving Diary Entry

**Basic Usage:**
```typescript
import { retrieveDiaryEntry } from '@/lib/ipfs';

const cid = 'QmXyz123...';

try {
  const entry = await retrieveDiaryEntry(cid);
  console.log('Goal ID:', entry.goalId);
  console.log('Reflection:', entry.reflection);
  console.log('Timestamp:', entry.timestamp);
} catch (error) {
  console.error('Failed to retrieve:', error);
}
```

**Low-Level API:**
```typescript
import { retrieveFromIPFS } from '@/lib/ipfs';

const cid = 'QmXyz123...';
const plaintext = await retrieveFromIPFS(cid);
console.log('Decrypted:', plaintext);
```

### URI Utilities

```typescript
import { uriToCID, cidToURI, getGatewayURL } from '@/lib/ipfs';

// Convert between formats
const uri = cidToURI('QmXyz123...');
// → 'ipfs://QmXyz123...'

const cid = uriToCID('ipfs://QmXyz123...');
// → 'QmXyz123...'

// Get gateway URL for public access
const url = getGatewayURL('QmXyz123...');
// → 'https://ipfs.io/ipfs/QmXyz123...'

// Custom gateway
const url2 = getGatewayURL('QmXyz123...', 'https://gateway.pinata.cloud/ipfs/');
// → 'https://gateway.pinata.cloud/ipfs/QmXyz123...'
```

---

## Privacy & Security

### What's Encrypted

✅ **Encrypted before IPFS:**
- Diary reflection text
- Image data (base64)
- All sensitive content

❌ **NOT Encrypted (metadata):**
- Goal ID (public metadata)
- Timestamp (public metadata)
- File size (visible on IPFS)
- Access patterns (IPFS network can see requests)

### Threat Model

#### ✅ Protected Against

1. **IPFS Gateway Reads Data**
   - Mitigation: Data is encrypted, gateway sees only ciphertext
   - Risk: None

2. **Network Eavesdropping**
   - Mitigation: Data encrypted before transmission
   - Risk: Low (even if HTTPS compromised)

3. **IPFS Node Operator Access**
   - Mitigation: Node operator sees only encrypted blobs
   - Risk: None

4. **Content Tampering**
   - Mitigation: IPFS is content-addressed (CID is hash of content)
   - Mitigation: AES-GCM authentication tag detects tampering
   - Risk: None (tampering detected)

#### ⚠️ Considerations

1. **File Size Leakage**
   - Risk: IPFS network can see file sizes
   - Impact: May reveal if entry has image (large) vs. text-only (small)
   - Mitigation: Consider padding to fixed sizes (future)

2. **Access Patterns**
   - Risk: IPFS gateway logs can show when you access specific CIDs
   - Impact: Timing attacks, correlation
   - Mitigation: Use Tor or VPN when accessing IPFS gateways

3. **Metadata**
   - Risk: Goal ID and timestamp sent as unencrypted metadata
   - Impact: Backend/IPFS node can correlate entries
   - Mitigation: If high privacy needed, encrypt metadata too

4. **CID Reuse**
   - Risk: Identical plaintext produces identical CID (deduplication)
   - Impact: Can detect if two users have same entry
   - Mitigation: Random IV ensures unique ciphertext every time

### Best Practices

1. **Always Encrypt First**
   - NEVER pin plaintext to IPFS
   - Use `pinToIPFS()` which encrypts automatically

2. **Verify IPFS is Optional**
   - Local IndexedDB is primary storage
   - IPFS is backup/sync layer only

3. **Use HTTPS for Backend**
   - Encrypted data is still sensitive (prevent MITM)

4. **Backup Your Key**
   - Without encryption key, IPFS data is useless
   - Export JWK and store securely

5. **Consider Gateway Privacy**
   - Public gateways log requests
   - Use private gateway or Tor for high privacy

---

## Integration with Diary Storage

### Save Entry (Local + IPFS)

```typescript
import { saveDiaryEntry } from '@/lib/diaryStorage';
import { pinDiaryEntry } from '@/lib/ipfs';

const entry = {
  goalId: 'run_5km',
  reflection: 'Today I ran 5km...',
  imageDataUrl: 'data:image/png;base64,...',
  timestamp: Date.now(),
};

// Save locally (always)
const entryId = await saveDiaryEntry(entry);

// Optionally pin to IPFS
try {
  const ipfsUri = await pinDiaryEntry(entry);

  // Store URI for later retrieval
  localStorage.setItem(`ipfs:${entryId}`, ipfsUri);

  console.log('Entry saved locally and on IPFS');
} catch (error) {
  console.warn('IPFS pinning failed, entry saved locally only');
}
```

### Retrieve Entry (IPFS Fallback)

```typescript
import { getDiaryEntry } from '@/lib/diaryStorage';
import { retrieveDiaryEntry, uriToCID } from '@/lib/ipfs';

const entryId = '1699999999999';

// Try local first (fastest)
let entry = await getDiaryEntry(entryId);

// If not found locally, try IPFS
if (!entry) {
  const ipfsUri = localStorage.getItem(`ipfs:${entryId}`);

  if (ipfsUri) {
    const cid = uriToCID(ipfsUri);
    entry = await retrieveDiaryEntry(cid);
  }
}

if (entry) {
  console.log('Retrieved entry:', entry);
} else {
  console.error('Entry not found in local or IPFS storage');
}
```

---

## On-Chain Storage (Future)

### Store CID in Soul-NFT Metadata

When evolving the NFT, include the IPFS URI in metadata:

```typescript
import { SoulNFT } from '@/lib/soulNFT';
import { pinDiaryEntry } from '@/lib/ipfs';

// Pin diary entry to IPFS
const ipfsUri = await pinDiaryEntry(entry);

// Evolve NFT with IPFS URI
const soulNFT = new SoulNFT(CONTRACT_ADDRESS);
await soulNFT.evolve({
  tokenId: 0,
  proofHash: entry.hash,
  metadataUri: ipfsUri,  // IPFS URI stored on-chain
});

console.log('NFT evolved with IPFS-backed proof');
```

**Benefits:**
- Decentralized proof storage (not just hash)
- Anyone can verify proof via IPFS
- Permanent record (immutable)

**Privacy:**
- On-chain metadata is public (CID visible to all)
- But data itself is encrypted
- Only user with key can decrypt

---

## Advanced Usage

### Batch Pinning

Pin multiple entries at once:

```typescript
import { pinToIPFS } from '@/lib/ipfs';

const entries = [
  { goalId: 'run_5km', reflection: 'Day 1' },
  { goalId: 'run_5km', reflection: 'Day 2' },
  { goalId: 'run_5km', reflection: 'Day 3' },
];

const results = await Promise.all(
  entries.map(entry =>
    pinToIPFS(JSON.stringify(entry), { goalId: entry.goalId })
  )
);

console.log('Pinned CIDs:', results.map(r => r.cid));
```

### Custom Metadata

Include custom metadata with pins:

```typescript
const result = await pinToIPFS(plaintext, {
  goalId: 'run_5km',
  timestamp: Date.now(),
  tags: ['fitness', 'running'],
  weekNumber: 3,
  userNote: 'First week of training',
});
```

Note: Metadata is NOT encrypted and may be stored by pinning service.

### Progress Tracking

Monitor upload/download progress (requires backend extension):

```typescript
// Future enhancement
const result = await pinToIPFS(plaintext, {
  onProgress: (progress) => {
    console.log(`Upload: ${progress.loaded} / ${progress.total} bytes`);
  }
});
```

---

## Troubleshooting

### "IPFS not available"

**Symptom:** `isIPFSAvailable()` returns `false`

**Causes:**
1. IPFS node not running
2. Backend misconfigured
3. Network issues

**Solutions:**
```bash
# Check if IPFS daemon is running
ipfs swarm peers

# Restart IPFS daemon
ipfs daemon

# Check backend health
curl http://localhost:8000/api/ipfs/health

# Verify IPFS_API_URL in .env
echo $IPFS_API_URL
```

### "Failed to pin to IPFS"

**Symptom:** `pinToIPFS()` throws error

**Causes:**
1. Data too large (>10 MB)
2. Invalid base64 encoding
3. IPFS node unreachable
4. Network timeout

**Solutions:**
```typescript
try {
  const result = await pinToIPFS(data);
} catch (error) {
  if (error.message.includes('too large')) {
    // Compress image or reduce quality
    console.error('Data exceeds 10MB limit');
  } else if (error.message.includes('network')) {
    // Retry or fall back to local storage
    console.error('IPFS unreachable, using local storage');
  } else {
    console.error('Unknown error:', error);
  }
}
```

### "Data not found on IPFS"

**Symptom:** `retrieveFromIPFS()` returns 404

**Causes:**
1. CID not pinned (garbage collected)
2. Wrong CID format
3. IPFS network partition

**Solutions:**
```typescript
import { retrieveFromIPFS } from '@/lib/ipfs';

try {
  const data = await retrieveFromIPFS(cid);
} catch (error) {
  if (error.message.includes('not found')) {
    console.error('CID not found, may have been unpinned');
    // Fall back to local storage
  }
}
```

**Prevention:** Always pin to a reliable pinning service (Pinata, Infura, etc.)

### "Decryption failed"

**Symptom:** Data retrieved from IPFS but can't decrypt

**Causes:**
1. Wrong encryption key
2. Data corrupted
3. CID mismatch

**Solutions:**
- Verify you're using the correct master key
- Check if key was restored from backup correctly
- Verify CID matches what was pinned

```typescript
import { getMasterKey } from '@/lib/keyManager';
import { exportKeyForBackup } from '@/lib/keyManager';

// Verify key exists
const key = await getMasterKey();
console.log('Key exists:', !!key);

// Export key to verify it's correct
const jwk = await exportKeyForBackup();
console.log('Key JWK:', jwk);
```

---

## Testing

### Backend Tests

```bash
cd backend
pytest test_ipfs.py -v
```

**Test Coverage:**
- Endpoint existence
- Data validation (required fields, base64, size limits)
- IPFS pinning and retrieval
- Error handling (404, 502)
- Health check

### Frontend Testing

```typescript
// In browser console
import { pinToIPFS, retrieveFromIPFS } from '@/lib/ipfs';

// Test round-trip
const plaintext = 'Hello IPFS!';
const result = await pinToIPFS(plaintext);
console.log('Pinned:', result.cid);

const retrieved = await retrieveFromIPFS(result.cid);
console.log('Retrieved:', retrieved);
console.assert(retrieved === plaintext, 'Round-trip failed!');
```

### Integration Testing

Test full flow: Encrypt → Pin → Store CID → Retrieve → Decrypt

```typescript
import { saveDiaryEntry, getDiaryEntry } from '@/lib/diaryStorage';
import { pinDiaryEntry, retrieveDiaryEntry } from '@/lib/ipfs';

// Save locally
const entry = {
  goalId: 'test',
  reflection: 'Integration test entry',
  timestamp: Date.now(),
};

const id = await saveDiaryEntry(entry);

// Pin to IPFS
const uri = await pinDiaryEntry(entry);
const cid = uri.substring(7); // Remove 'ipfs://'

// Retrieve from IPFS
const retrieved = await retrieveDiaryEntry(cid);

console.assert(retrieved.reflection === entry.reflection, 'Reflection mismatch');
console.log('Integration test passed!');
```

---

## Performance

### Benchmarks

**Local Storage (IndexedDB):**
- Write: ~5 ms
- Read: ~2 ms
- No network latency

**IPFS Pinning:**
- Local node: ~50-200 ms
- Remote pinning service: ~500-2000 ms
- Depends on file size and network

**IPFS Retrieval:**
- Cached: ~50-100 ms
- Uncached: ~500-3000 ms
- Depends on gateway and DHT lookup

### Optimization Tips

1. **Use Local Storage as Primary**
   - IPFS for backup/sync only
   - Don't block UI on IPFS operations

2. **Background Pinning**
   ```typescript
   // Don't await IPFS pinning
   pinDiaryEntry(entry).catch(err =>
     console.warn('Background pinning failed:', err)
   );

   // Continue with local save
   await saveDiaryEntry(entry);
   ```

3. **Lazy Loading**
   - Only retrieve from IPFS when needed
   - Prefer local IndexedDB for recent entries

4. **Compress Images**
   ```typescript
   // Before pinning, compress image
   const compressed = await compressImage(imageDataUrl, {
     maxWidth: 1920,
     maxHeight: 1080,
     quality: 0.8,
   });

   await pinDiaryEntry({ ...entry, imageDataUrl: compressed });
   ```

---

## API Reference

### Frontend Functions

```typescript
// Health check
isIPFSAvailable(): Promise<boolean>

// Low-level pinning
pinToIPFS(
  plaintext: string,
  metadata?: Record<string, unknown>
): Promise<IPFSPinResult>

// Low-level retrieval
retrieveFromIPFS(cid: string): Promise<string>

// High-level diary functions
pinDiaryEntry(entry: {
  goalId: string;
  reflection: string;
  imageDataUrl?: string;
  timestamp: number;
}): Promise<string>

retrieveDiaryEntry(cid: string): Promise<{
  goalId: string;
  reflection: string;
  imageDataUrl?: string;
  timestamp: number;
}>

// URI utilities
uriToCID(uri: string): string
cidToURI(cid: string): string
getGatewayURL(cid: string, gateway?: string): string
```

### Backend Endpoints

```python
# Pin encrypted data
POST /api/ipfs/pin
Request: { data: str, metadata?: dict }
Response: { cid: str, uri: str, size: int }

# Retrieve data
GET /api/ipfs/{cid}
Response: { data: str, size: int }

# Health check
GET /api/ipfs/health
Response: { status: str, ipfs_available: bool, ipfs_version?: str }
```

---

## References

- [IPFS Documentation](https://docs.ipfs.tech/)
- [IPFS HTTP API](https://docs.ipfs.tech/reference/kubo/rpc/)
- [Pinata IPFS Pinning Service](https://www.pinata.cloud/)
- [Infura IPFS](https://infura.io/product/ipfs)
- [Content Addressing](https://docs.ipfs.tech/concepts/content-addressing/)
- [IPFS Privacy & Security](https://docs.ipfs.tech/concepts/privacy-and-encryption/)

---

**Your data, your keys, your control.** 🌐🔐
