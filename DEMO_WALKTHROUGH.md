# Proof of Becoming - Demo Walkthrough

Welcome to the **Proof of Becoming** dApp! This guide walks you through the complete user experience from wallet connection to NFT evolution.

## 🎯 What is Proof of Becoming?

Proof of Becoming is a privacy-first ritual journaling dApp on Tezos that:
- Lets you track daily goals with **encrypted diary entries**
- Verifies your progress with **AI-powered proof submission**
- Rewards you with **evolving Soul NFTs** that visually represent your journey
- Generates **quantum-seeded generative art** for each evolution stage

## 🎬 Demo Video Overview

### Key Features Demonstrated

1. **Privacy-First Journaling** - Client-side encryption, zero on-chain diary data
2. **Proof Submission** - Photo + reflection verification with AI
3. **NFT Evolution** - Dynamic artwork generated from quantum random seeds
4. **Generative Art Gallery** - View your Soul NFT's evolution journey

---

## 📖 Complete User Journey

### Phase 1: Setup & Wallet Connection

#### Step 1.1: Connect Wallet

1. Open the Proof of Becoming dApp
2. Click **"Connect Wallet"** button in the top right
3. Select your Tezos wallet (Temple, Kukai, or Beacon)
4. Approve the connection request

**Expected Result**:
- Wallet address displayed (e.g., `tz1ABC...XYZ`)
- "Connected" status indicator shown
- Navigation options now available

**Screenshot Location**: Home page with connected wallet

---

#### Step 1.2: Mint Your Soul NFT

1. Navigate to **"Mint NFT"** page
2. Review the Soul NFT concept
3. Click **"Mint Soul NFT"** button
4. Confirm the transaction in your wallet
5. Wait for blockchain confirmation (~30 seconds)

**Expected Result**:
- Success notification: "Soul NFT minted successfully!"
- NFT appears in your wallet
- Initial stage: **Stage 0** (seed form)

**What Just Happened**:
- An FA2 (TZIP-12) token was created
- Token is **soul-bound** (non-transferable)
- Metadata URI initialized
- You now own a unique Soul NFT tied to your wallet

---

### Phase 2: Daily Ritual Journaling

#### Step 2.1: Create Diary Entry

1. Click **"New Diary Entry"** in navigation
2. Select a goal from dropdown:
   - Run 5km
   - Read 20 pages
   - Meditate 10 minutes
   - Make a sketch
   - Custom goal

**Screenshot**: Goal selection dropdown

---

#### Step 2.2: Write Reflection

1. Write your reflection (minimum 20 characters)
   - Example: *"Completed my 5km run today. Felt strong and maintained good pace throughout. The weather was perfect and I enjoyed every minute of it."*
2. Note the character count indicator
3. Observe real-time validation

**Validation Rules**:
- Minimum 20 characters
- Maximum 5000 characters
- No spam patterns (excessive repetition)
- Cannot be only whitespace

**Screenshot**: Reflection textarea with validation

---

#### Step 2.3: Upload Proof Photo

1. Click **"Upload Image"** button
2. Select photo from your device
   - Must be JPEG, PNG, or WEBP
   - Maximum 5MB file size
   - SVG files rejected (security)

**What Happens**:
- Image validated client-side
- Converted to data URL
- **Encrypted** using AES-256-GCM
- Stored in IndexedDB (never sent to server in plaintext)

**Screenshot**: Image upload with preview

---

#### Step 2.4: Save Entry

1. Review your entry
2. Click **"Save Entry"**
3. Wait for encryption and storage

**Expected Result**:
- Success notification: "Entry saved successfully!"
- Entry ID generated
- Hash created (SHA-256 of encrypted data)
- Timestamp recorded

**Privacy Note**:
- All diary data is **encrypted client-side**
- Keys stored in IndexedDB
- Only encrypted blobs sent to IPFS (optional)
- **Zero plaintext data** ever leaves your browser

---

### Phase 3: Proof Verification & NFT Evolution

#### Step 3.1: View Diary History

1. Navigate to **"Diary History"**
2. See all your encrypted entries
3. Entries sorted by most recent first

**Screenshot**: Diary history list view

---

#### Step 3.2: Submit Proof for Verification

1. Click **"Verify Proof"** on an entry
2. Review your reflection and image
3. Click **"Submit Proof"**

**What Happens Behind the Scenes**:
1. **Heuristic Verification**:
   - Valid goal ID? ✓
   - Sufficient reflection length? ✓
   - Valid image format? ✓
   - Keywords match goal? ✓

2. **AI Vision Verification** (if OpenAI API configured):
   - GPT-4 Vision analyzes your photo
   - Checks if image matches goal
   - Compares reflection to visual evidence
   - Returns confidence score (0-100%)

3. **Confidence Scoring**:
   - **70%+**: Verified! ✅
   - **60-69%**: Request second photo 📸
   - **Below 60%**: Not verified ❌

**Screenshot**: Verification in progress

---

#### Step 3.3: Handle Verification Results

**Scenario A: High Confidence (70%+)**

- Success notification: "Proof verified with 85% confidence!"
- "Evolve Soul NFT" button appears
- Verification checks displayed:
  - ✓ Valid Goal
  - ✓ Sufficient Reflection
  - ✓ Valid Image
  - ✓ AI Verified

**Screenshot**: Successful verification result

---

**Scenario B: Low Confidence (60-69%)**

- Warning notification: "Verification inconclusive. Please provide a second photo."
- Second photo upload field appears
- Upload additional proof image
- Click "Submit with Second Photo"
- Re-evaluation with both images

**Screenshot**: Second photo request UI

---

**Scenario C: Failed Verification (Below 60%)**

- Error message explaining why
- Suggestions for improvement:
  - Take clearer photo
  - Ensure photo matches goal
  - Write more detailed reflection
- Can retry with new entry

---

#### Step 3.4: Evolve Your Soul NFT

After successful verification:

1. Click **"Evolve Soul NFT"** button
2. Wait for quantum seed generation
3. Watch artwork generation preview
4. Confirm transaction in wallet
5. Wait for blockchain confirmation

**What Happens**:

**Step 3.4.1: Quantum Seed Generation**
- Backend calls ANU Quantum Random Number Generator
- Fetches 32 bytes of genuine quantum randomness
- Fallback to CSPRNG if quantum source unavailable
- Seed returned as 64-character hex string

**Screenshot**: Seed generation loading

**Step 3.4.2: Generative Art Creation**
- Seed determines ALL visual parameters:
  - Color palette (5 colors extracted from seed)
  - Geometry (shapes, complexity, symmetry)
  - Rotation angle
  - Pattern parameters

- Art layers rendered:
  1. Radial gradient background
  2. Interference patterns (quantum-inspired waves)
  3. Circular patterns (rings increase with stage)
  4. Geometric shapes (polygons with optional symmetry)

- Output: 512x512 PNG with deterministic rendering
  - **Same seed = identical art** (reproducible)

**Screenshot**: Art generation preview

**Step 3.4.3: IPFS Pinning**
- Artwork pinned to IPFS
- CID (Content Identifier) returned
- Fallback to data URI if IPFS unavailable
- Metadata created with NFT standard schema

**Screenshot**: IPFS pinning progress

**Step 3.4.4: Metadata Creation**
```json
{
  "name": "Soul NFT #1",
  "description": "Evolution Stage 1 - Proof of run_5km",
  "image": "ipfs://Qm...",
  "stage": 1,
  "seed": "a1b2c3...",
  "seedSource": "quantum",
  "colors": ["#1a2b3c", "#4d5e6f", ...],
  "geometry": {
    "shapes": 7,
    "complexity": 0.73,
    "symmetry": true,
    "rotation": 1.57
  },
  "attributes": [
    {"trait_type": "Stage", "value": 1},
    {"trait_type": "Goal", "value": "run_5km"},
    {"trait_type": "Seed Source", "value": "quantum"},
    {"trait_type": "Shapes", "value": 7},
    {"trait_type": "Symmetry", "value": "Yes"}
  ]
}
```

**Step 3.4.5: On-Chain Evolution**
- Smart contract `evolve()` called
- Parameters: tokenId, stage, seed, metadataUri
- Transaction broadcasted to Ghostnet
- Confirmation awaited

**Expected Result**:
- Success notification: "Soul NFT evolved to stage 1! 🎨"
- New artwork visible in gallery
- NFT metadata updated on-chain
- Evolution complete!

**Screenshot**: Evolution success with artwork preview

---

### Phase 4: Gallery & NFT Viewing

#### Step 4.1: View Gallery

1. Click **"View Gallery 🎨"** button
2. See grid of Soul NFTs
3. Your NFT highlighted with "Your NFT" badge

**Gallery Features**:
- Grid layout with hover effects
- Artwork display (256x256 thumbnails)
- Token ID and stage information
- Owner address
- Expandable seed details

**Screenshot**: Gallery grid view

---

#### Step 4.2: Inspect NFT Details

1. Click on your NFT card
2. View full details:
   - Token ID
   - Evolution Stage
   - Seed (64 hex characters)
   - Seed Source (quantum vs pseudo)
   - Color palette
   - Geometry parameters
   - Creation timestamp

**Screenshot**: NFT detail view with metadata

---

#### Step 4.3: Visual Evolution Comparison

- View multiple evolution stages side-by-side
- Notice how artwork changes with each stage:
  - More circular patterns added
  - Increased complexity
  - Color variations
  - Geometric transformations

**Screenshot**: Multi-stage comparison

---

## 🔒 Privacy & Security Features

### Client-Side Encryption

**How It Works**:
1. AES-256-GCM encryption key generated in browser
2. Key stored in IndexedDB (never leaves device)
3. Diary entries encrypted before storage
4. Only encrypted blobs optionally sent to IPFS
5. Decryption happens client-side on retrieval

**Privacy Guarantees**:
- ✅ Zero plaintext diary data on-chain
- ✅ Zero plaintext data sent to backend
- ✅ IPFS only stores encrypted blobs
- ✅ Only you can decrypt your entries
- ✅ Hash-only commitment on blockchain

**Screenshot**: Encryption flow diagram

---

### Input Validation & Security

**File Upload Protection**:
- ✅ SVG files rejected (XSS prevention)
- ✅ Suspicious extensions blocked (.exe, .bat, etc.)
- ✅ File size limited to 5MB
- ✅ MIME type validation
- ✅ Content validation

**Text Input Protection**:
- ✅ Spam pattern detection
- ✅ Length validation
- ✅ Special character filtering
- ✅ SQL injection prevention

---

### Rate Limiting

**API Protection**:
- Verify endpoint: 5 requests/minute
- QRNG endpoint: 10 requests/minute
- IPFS pin: 3 requests/minute

**User Experience**:
- 429 error with clear message
- Retry-After header indicates wait time
- User-friendly notification: "You've made too many requests. Please wait 60 seconds."

---

## 🎨 Technical Highlights

### Quantum Random Number Generation

**Why Quantum?**
- True randomness (not pseudo-random)
- Unpredictable and unique seeds
- Genuine quantum source (ANU QRNG)

**How It Works**:
1. Backend requests random bytes from ANU Quantum RNG
2. ANU measures quantum phenomena (vacuum fluctuations)
3. Returns genuinely random data
4. Converted to 64-character hex seed
5. Fallback to cryptographically secure PRNG if unavailable

**Impact on Art**:
- Each NFT is truly unique
- Seeds cannot be predicted
- Deterministic generation ensures reproducibility
- Same seed always produces identical artwork

---

### Deterministic Art Generation

**Seed-Based PRNG**:
```typescript
class SeededRandom {
  private seed: number;

  constructor(seedString: string) {
    // Use first 8 hex chars as seed
    this.seed = parseInt(seedString.substring(0, 8), 16);
  }

  next(): number {
    // Linear Congruential Generator
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
}
```

**Benefits**:
- **Reproducible**: Same seed = same art
- **Verifiable**: Anyone can regenerate artwork from seed
- **Efficient**: No need to store large image files
- **Trustless**: Seed on-chain proves authenticity

---

## 🧪 Error Handling & Resilience

### Network Failures

**Automatic Retry Logic**:
- Exponential backoff (2s → 4s → 8s → 16s)
- Maximum 4-5 retry attempts
- Jitter to prevent thundering herd
- Smart exception filtering (don't retry 404s)

**User Experience**:
- Loading indicators during retries
- Error messages with actionable suggestions
- Graceful fallbacks (IPFS → data URI, QRNG → CSPRNG)

---

### Error Boundaries

**React Error Boundary**:
- Catches unhandled errors
- Prevents white screen of death
- Shows user-friendly fallback UI
- Development mode shows stack trace
- Production mode hides technical details

**User Options**:
- "Try Again" button (reset state)
- "Go Home" button (navigate away)

---

### Notification System

**Toast Notifications**:
- Success (green): Confirmations
- Error (red): Failures with suggestions
- Warning (orange): Edge cases (second photo needed)
- Info (blue): Informational messages

**Features**:
- Auto-dismiss (5 seconds default)
- Stackable notifications
- Slide-in/out animations
- Mobile responsive

---

## 📊 Feature Comparison

| Feature | Traditional Journaling | Proof of Becoming |
|---------|------------------------|-------------------|
| Privacy | Server-side storage | Client-side encryption |
| Verification | Honor system | AI + Blockchain proof |
| Rewards | None | Evolving NFTs |
| Ownership | Platform owns data | You own encrypted data |
| Portability | Platform locked | IPFS + Blockchain |
| Art | Static | Generative, evolving |
| Randomness | Pseudo-random | Quantum random |

---

## 🎓 Educational Aspects

### What You Learn

**Blockchain Concepts**:
- Wallet connection and management
- Transaction signing
- Gas fees and confirmations
- Smart contract interactions
- Token standards (FA2/TZIP-12)

**Privacy Technology**:
- Client-side encryption
- Zero-knowledge proofs (hash commitments)
- Decentralized storage (IPFS)

**Generative Art**:
- Seed-based randomness
- Deterministic algorithms
- Color theory
- Geometric patterns

---

## 🚀 Next Steps After Demo

1. **Explore Different Goals**
   - Try all goal types
   - Create custom goals
   - Build a streak

2. **Evolve Multiple Stages**
   - Complete daily rituals
   - Verify proofs
   - Watch your NFT evolve through stages

3. **Share Your Journey**
   - Screenshot your evolved NFT
   - Share in community
   - Inspire others

4. **Provide Feedback**
   - Report bugs on GitHub
   - Suggest features
   - Join community discussions

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: Wallet won't connect
**Solution**: Refresh page, ensure Temple/Kukai is installed and unlocked

**Issue**: Transaction pending forever
**Solution**: Check Ghostnet explorer, transaction may need more confirmations

**Issue**: Image upload fails
**Solution**: Ensure image is under 5MB and in JPEG/PNG/WEBP format

**Issue**: Verification fails repeatedly
**Solution**: Take clearer photo that directly shows goal completion

**Issue**: NFT doesn't appear in gallery
**Solution**: Wait for blockchain confirmation, refresh page

---

## 📝 Glossary

**Soul NFT**: Non-transferable token representing your personal growth journey

**FA2**: Tezos token standard (TZIP-12), like ERC-721 on Ethereum

**IPFS**: InterPlanetary File System, decentralized storage network

**CID**: Content Identifier, unique hash for IPFS content

**AES-256-GCM**: Advanced Encryption Standard with Galois/Counter Mode

**QRNG**: Quantum Random Number Generator using quantum phenomena

**Seed**: 64-character hex string determining all artwork parameters

**Proof**: Photo + reflection submitted for verification

**Evolution**: Process of advancing NFT to next visual stage

---

## 🎉 Congratulations!

You've completed the Proof of Becoming demo walkthrough. You now understand:

✅ How to create encrypted diary entries
✅ How proof verification works
✅ How quantum seeds generate unique art
✅ How NFTs evolve with your progress
✅ Privacy-first design principles

**Start your journey today** and watch your Soul NFT become a visual representation of your growth!

---

**Questions?** Check the [GitHub repo](https://github.com/basedlsg/TZs-NFT) or join our community.

**Last Updated**: Week 6 - Hardening & Demo Complete
**dApp Version**: 0.5.0
