# Soul-NFT Contract Interaction Guide

This guide explains how to interact with the Soul-NFT smart contract from the frontend using the Taquito wrapper.

---

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Contract Address

Add the deployed contract address to `.env.local`:

```bash
NEXT_PUBLIC_SOUL_NFT_CONTRACT=KT1YourContractAddressHere
```

### 3. Connect Wallet

Users must connect their Tezos wallet before performing write operations (mint, evolve).

```typescript
import { useWallet } from '@/contexts/WalletContext';

function MyComponent() {
  const { connect, connected } = useWallet();

  if (!connected) {
    return <button onClick={connect}>Connect Wallet</button>;
  }

  // ... perform contract operations
}
```

---

## Contract Wrapper API

### Import

```typescript
import { getSoulNFTContract, SoulNFT } from '@/lib/soulNFT';
```

### Get Contract Instance

```typescript
// Using environment variable
const contract = getSoulNFTContract();

// Or with explicit address
const contract = new SoulNFT('KT1YourContractAddress');
```

---

## Write Operations

### Mint Soul-NFT (Admin Only)

**Purpose:** Mint a new Soul-NFT for a user address.

**Access:** Only the contract admin can call this.

**Parameters:**
- `owner` (string): Tezos address to receive the NFT (tz1/tz2/tz3)
- `metadataUri` (string): IPFS URI pointing to initial metadata

**Returns:** `{ hash: string, confirmation: () => Promise }`

**Example:**

```typescript
import { getSoulNFTContract } from '@/lib/soulNFT';

async function mintSoulNFT(ownerAddress: string) {
  try {
    const contract = getSoulNFTContract();

    const result = await contract.mintSoul(
      ownerAddress,
      'ipfs://QmTest123...abc'
    );

    console.log('Operation hash:', result.hash);
    console.log('Explorer:', `https://ghostnet.tzkt.io/${result.hash}`);

    // Wait for confirmation
    await result.confirmation();
    console.log('Mint confirmed!');

  } catch (error) {
    if (error.message.includes('already has a Soul-NFT')) {
      alert('This address already has a Soul-NFT');
    } else if (error.message.includes('Only the contract admin')) {
      alert('You must be the admin to mint');
    } else {
      console.error('Mint failed:', error);
    }
  }
}
```

**Error Handling:**

| Error Message | Meaning | User Action |
|---------------|---------|-------------|
| "Invalid owner address" | Address format incorrect | Check address starts with tz1/tz2/tz3 |
| "Metadata URI is required" | Empty URI | Provide valid IPFS URI |
| "Only the contract admin can mint" | Not admin | Use admin wallet |
| "This address already has a Soul-NFT" | Duplicate mint | Each address can only have 1 NFT |

---

### Evolve Soul-NFT (Owner Only)

**Purpose:** Update metadata of an existing Soul-NFT after verification.

**Access:** Only the token owner can evolve their own NFT.

**Parameters:**
- `tokenId` (number): Token ID to evolve
- `stage` (number): New evolution stage (increments with each proof)
- `seed` (string): Quantum/cryptographic seed for generative art
- `metadataUri` (string): New IPFS URI with updated metadata

**Returns:** `{ hash: string, confirmation: () => Promise }`

**Example:**

```typescript
import { getSoulNFTContract } from '@/lib/soulNFT';

async function evolveSoulNFT(tokenId: number, newMetadataUri: string) {
  try {
    const contract = getSoulNFTContract();

    // Get current stage (you'd fetch this from metadata)
    const currentMetadata = await contract.getTokenMetadata(tokenId);
    const nextStage = (currentMetadata?.stage || 0) + 1;

    // Generate or fetch quantum seed (from backend)
    const quantumSeed = await fetchQuantumSeed(); // Your implementation

    const result = await contract.evolve({
      tokenId,
      stage: nextStage,
      seed: quantumSeed,
      metadataUri: newMetadataUri,
    });

    console.log('Evolution operation hash:', result.hash);

    // Wait for confirmation
    await result.confirmation();
    console.log('Evolution confirmed!');

    // Fetch updated metadata
    const updated = await contract.getTokenMetadata(tokenId);
    console.log('New stage:', updated?.stage);

  } catch (error) {
    if (error.message.includes('do not own this token')) {
      alert('You can only evolve your own Soul-NFT');
    } else if (error.message.includes('Token does not exist')) {
      alert('Token not found');
    } else {
      console.error('Evolution failed:', error);
    }
  }
}

async function fetchQuantumSeed(): Promise<string> {
  // Call backend API to get QRNG seed
  const response = await fetch('/api/quantum-seed');
  const data = await response.json();
  return data.seed;
}
```

**Error Handling:**

| Error Message | Meaning | User Action |
|---------------|---------|-------------|
| "Invalid token ID" | Negative or non-integer | Check token ID is valid |
| "Invalid stage number" | Negative or non-integer | Stage must be non-negative |
| "Seed is required" | Empty seed | Provide quantum/crypto seed |
| "You do not own this token" | Not the owner | Connect wallet that owns the NFT |
| "Token does not exist" | Token ID not minted | Verify token ID |

---

## Read Operations

### Get Token Metadata

**Purpose:** Fetch metadata for a specific token.

**Parameters:**
- `tokenId` (number): Token ID to query

**Returns:** `TokenMetadata | null`

```typescript
interface TokenMetadata {
  tokenId: number;
  metadataUri: string;
  stage?: number;
  seed?: string;
}
```

**Example:**

```typescript
import { getSoulNFTContract } from '@/lib/soulNFT';

async function displayTokenMetadata(tokenId: number) {
  const contract = getSoulNFTContract();

  const metadata = await contract.getTokenMetadata(tokenId);

  if (!metadata) {
    console.log('Token not found');
    return;
  }

  console.log('Token ID:', metadata.tokenId);
  console.log('Metadata URI:', metadata.metadataUri);
  console.log('Stage:', metadata.stage || 0);
  console.log('Seed:', metadata.seed || 'N/A');

  // Fetch full metadata from IPFS
  const fullMetadata = await fetch(metadata.metadataUri.replace('ipfs://', 'https://ipfs.io/ipfs/'));
  const data = await fullMetadata.json();
  console.log('Full metadata:', data);
}
```

---

### Get Balance

**Purpose:** Check if an address owns a specific token (returns 0 or 1).

**Parameters:**
- `owner` (string): Address to check
- `tokenId` (number): Token ID to check

**Returns:** `number` (0 or 1)

**Example:**

```typescript
import { getSoulNFTContract } from '@/lib/soulNFT';

async function checkOwnership(address: string, tokenId: number) {
  const contract = getSoulNFTContract();

  const balance = await contract.getBalance(address, tokenId);

  if (balance === 1) {
    console.log(`${address} owns token ${tokenId}`);
  } else {
    console.log(`${address} does not own token ${tokenId}`);
  }

  return balance === 1;
}
```

---

### Get Token ID by Owner

**Purpose:** Find which token (if any) an address owns.

**Parameters:**
- `owner` (string): Address to check

**Returns:** `number | null`

**Example:**

```typescript
import { getSoulNFTContract } from '@/lib/soulNFT';

async function getOwnedToken(address: string) {
  const contract = getSoulNFTContract();

  const tokenId = await contract.getTokenIdByOwner(address);

  if (tokenId !== null) {
    console.log(`${address} owns token ID: ${tokenId}`);

    // Fetch metadata for this token
    const metadata = await contract.getTokenMetadata(tokenId);
    console.log('Metadata:', metadata);
  } else {
    console.log(`${address} does not own any Soul-NFT`);
  }

  return tokenId;
}
```

---

## Gas Estimation

**Purpose:** Estimate gas before sending a transaction.

**Parameters:**
- `operation` ('mint' | 'evolve'): Operation type
- `params`: Operation parameters

**Returns:** `GasEstimate`

```typescript
interface GasEstimate {
  gasLimit: number;
  storageLimit: number;
  suggestedFeeMutez: number;
}
```

**Example:**

```typescript
import { getSoulNFTContract } from '@/lib/soulNFT';

async function estimateEvolutionCost(tokenId: number) {
  const contract = getSoulNFTContract();

  const estimate = await contract.estimateGas('evolve', {
    tokenId,
    stage: 1,
    seed: 'test-seed',
    metadataUri: 'ipfs://test',
  });

  console.log('Gas limit:', estimate.gasLimit);
  console.log('Storage limit:', estimate.storageLimit);
  console.log('Suggested fee (mutez):', estimate.suggestedFeeMutez);
  console.log('Suggested fee (XTZ):', estimate.suggestedFeeMutez / 1_000_000);

  return estimate;
}
```

---

## Complete Example: Evolution Flow

```typescript
import { getSoulNFTContract } from '@/lib/soulNFT';
import { useWallet } from '@/contexts/WalletContext';

async function completeEvolutionFlow() {
  const { address, connected } = useWallet();

  if (!connected || !address) {
    alert('Please connect your wallet');
    return;
  }

  try {
    const contract = getSoulNFTContract();

    // 1. Find user's token ID
    const tokenId = await contract.getTokenIdByOwner(address);

    if (tokenId === null) {
      alert('You do not own a Soul-NFT. Mint one first!');
      return;
    }

    console.log('Found your token:', tokenId);

    // 2. Get current metadata
    const currentMetadata = await contract.getTokenMetadata(tokenId);

    if (!currentMetadata) {
      alert('Error fetching metadata');
      return;
    }

    const nextStage = (currentMetadata.stage || 0) + 1;
    console.log(`Evolving from stage ${currentMetadata.stage || 0} to ${nextStage}`);

    // 3. Generate new metadata URI (after proof verification)
    // This would come from your backend after AI verification
    const newMetadataUri = await generateNewMetadata(tokenId, nextStage);

    // 4. Get quantum seed from backend
    const quantumSeed = await fetchQuantumSeed();

    // 5. Estimate gas
    const estimate = await contract.estimateGas('evolve', {
      tokenId,
      stage: nextStage,
      seed: quantumSeed,
      metadataUri: newMetadataUri,
    });

    console.log('Estimated cost:', estimate.suggestedFeeMutez / 1_000_000, 'XTZ');

    // 6. Confirm with user
    const confirmed = confirm(`Evolve to stage ${nextStage}? Cost: ~${(estimate.suggestedFeeMutez / 1_000_000).toFixed(4)} XTZ`);

    if (!confirmed) {
      return;
    }

    // 7. Execute evolution
    const result = await contract.evolve({
      tokenId,
      stage: nextStage,
      seed: quantumSeed,
      metadataUri: newMetadataUri,
    });

    console.log('Evolution transaction:', result.hash);
    alert(`Evolution started! Track on explorer: https://ghostnet.tzkt.io/${result.hash}`);

    // 8. Wait for confirmation
    await result.confirmation();
    alert('Evolution complete! Your Soul-NFT has evolved.');

    // 9. Fetch updated metadata
    const updated = await contract.getTokenMetadata(tokenId);
    console.log('New metadata:', updated);

  } catch (error) {
    console.error('Evolution failed:', error);
    alert(`Error: ${error.message}`);
  }
}

async function generateNewMetadata(tokenId: number, stage: number): Promise<string> {
  // Call backend to generate metadata with new art
  const response = await fetch('/api/generate-metadata', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tokenId, stage }),
  });

  const data = await response.json();
  return data.metadataUri;
}

async function fetchQuantumSeed(): Promise<string> {
  const response = await fetch('/api/quantum-seed');
  const data = await response.json();
  return data.seed;
}
```

---

## Best Practices

### 1. Always Estimate Gas First

```typescript
const estimate = await contract.estimateGas('evolve', params);
console.log('Estimated cost:', estimate.suggestedFeeMutez / 1_000_000, 'XTZ');
```

### 2. Wait for Confirmations

```typescript
const result = await contract.evolve(params);
await result.confirmation(); // Wait for block inclusion
```

### 3. Handle Errors Gracefully

```typescript
try {
  await contract.mintSoul(owner, uri);
} catch (error) {
  if (error.message.includes('already has')) {
    // Handle duplicate mint
  } else if (error.message.includes('admin')) {
    // Handle permission error
  } else {
    // Generic error handling
  }
}
```

### 4. Cache Contract Instance

```typescript
// In a React hook
const contract = useMemo(() => getSoulNFTContract(), []);
```

### 5. Show User Feedback

```typescript
setLoading(true);
try {
  const result = await contract.evolve(params);
  setStatus('Waiting for confirmation...');
  await result.confirmation();
  setStatus('Success!');
} catch (error) {
  setStatus('Failed: ' + error.message);
} finally {
  setLoading(false);
}
```

---

## Troubleshooting

### "Contract address not provided"
**Solution:** Set `NEXT_PUBLIC_SOUL_NFT_CONTRACT` in `.env.local`

### "Invalid contract address"
**Solution:** Address must start with `KT1`

### "User rejected permissions"
**Solution:** User canceled wallet popup; prompt them to retry

### "Insufficient funds"
**Solution:** User needs more XTZ for gas fees

### Gas estimation fails
**Solution:** Check contract is deployed and address is correct

---

## Next Steps

- **Week 3:** Add IPFS metadata generation
- **Week 4:** Integrate AI verification before evolution
- **Week 5:** Generate quantum-seeded NFT art

---

## References

- [Taquito Documentation](https://tezostaquito.io/)
- [Soul-NFT Contract README](../contracts/README.md)
- [Wallet Integration](./WALLET_INTEGRATION.md)
