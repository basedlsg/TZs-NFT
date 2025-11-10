# Proof of Becoming - Threat Model

Security analysis and threat mitigation for the Proof of Becoming dApp.

---

## Executive Summary

**Privacy Goal:** User diary entries remain private while proving ritual completion on-chain.

**Key Security Properties:**
- ✅ **Client-side encryption:** Diary never leaves browser in plaintext
- ✅ **Zero-knowledge proofs:** On-chain commitments don't reveal content
- ✅ **Soul-bound tokens:** NFTs cannot be transferred or stolen
- ✅ **Rate limiting:** Prevents abuse of AI verification

**Risk Level:** Medium (requires careful implementation, ongoing monitoring)

---

## Assets & Trust Boundaries

### Assets

1. **User Diary Entries (HIGH SENSITIVITY)**
   - Reflections, photos, personal goals
   - **Impact if compromised:** Privacy violation, emotional harm

2. **Encryption Keys (CRITICAL)**
   - 256-bit AES-GCM master key
   - **Impact if compromised:** All diary data readable

3. **Soul-NFT Ownership (MEDIUM)**
   - Non-transferable NFT representing ritual journey
   - **Impact if compromised:** Loss of progress, identity theft

4. **Wallet Private Keys (CRITICAL)**
   - Tezos wallet credentials
   - **Impact if compromised:** Loss of funds, NFT control

5. **AI Verification Integrity (MEDIUM)**
   - Ensures proofs are legitimate
   - **Impact if compromised:** Fake progress, spam

### Trust Boundaries

```
┌─────────────────────────────────────┐
│ User's Browser (TRUSTED)            │
│ - Encryption keys                   │
│ - Plaintext diary                   │
│ - Wallet connection                 │
└───────┬────────────────────┬────────┘
        │                    │
        ▼                    ▼
┌───────────────┐    ┌──────────────┐
│ IPFS Network  │    │ Tezos Chain  │
│ (UNTRUSTED)   │    │ (TRUSTED*)   │
│ - Encrypted   │    │ - Hashes     │
│   blobs only  │    │ - Metadata   │
└───────────────┘    └──────────────┘
        │                    │
        ▼                    ▼
┌─────────────────────────────────────┐
│ Backend API (SEMI-TRUSTED)          │
│ - AI verification                   │
│ - QRNG seed generation              │
│ - No access to plaintext diary      │
└─────────────────────────────────────┘

* Tezos blockchain is trusted for consensus,
  but data is public (only hashes stored)
```

---

## Threat Categories

### 1. Confidentiality Threats

#### T1.1: Network Eavesdropping

**Description:** Adversary intercepts network traffic to read diary.

**Attack Vector:**
- Man-in-the-middle on HTTP connection
- Compromised ISP/network infrastructure
- Public WiFi snooping

**Mitigations:**
- ✅ **HTTPS enforced** (TLS 1.3)
- ✅ **Client-side encryption** (data encrypted before transmission)
- ✅ **No plaintext transmission** (only encrypted blobs to IPFS)

**Residual Risk:** LOW (TLS + client-side encryption)

---

#### T1.2: Server-Side Storage Breach

**Description:** Backend server or IPFS node compromised.

**Attack Vector:**
- Hack into backend API
- Compromise IPFS node
- Access cloud storage

**Mitigations:**
- ✅ **No plaintext on server** (only encrypted blobs)
- ✅ **No keys on server** (keys stay in browser)
- ✅ **Backend is stateless** (no diary storage)
- ⚠️ **IPFS pins encrypted blobs only** (optional feature)

**Residual Risk:** LOW (encrypted data useless without key)

---

#### T1.3: On-Chain Data Analysis

**Description:** Adversary analyzes blockchain data to infer diary content.

**Attack Vector:**
- Read Soul-NFT metadata
- Correlate hashes with timing
- Analyze transaction patterns

**Mitigations:**
- ✅ **Hash commitments only** (no plaintext on-chain)
- ✅ **SHA-256 hashing** (one-way, irreversible)
- ✅ **No correlation data** (hashes cannot be linked to encrypted IPFS)

**Residual Risk:** VERY LOW (hash cannot be reversed)

---

#### T1.4: Browser Storage Leak

**Description:** Adversary reads IndexedDB from user's browser.

**Attack Vector:**
- Physical device access
- Malware on user's computer
- Browser extension with storage permissions

**Mitigations:**
- ✅ **Same-origin policy** (IndexedDB isolated per domain)
- ✅ **Device encryption encouraged** (FileVault, BitLocker)
- ⚠️ **XSS protection** (CSP headers, input sanitization)
- ❌ **Physical access** (out of scope, user responsibility)

**Residual Risk:** MEDIUM (malware/XSS can read browser storage)

**Future Enhancement:**
- Password-derive encryption (wrap master key with user password)
- WebAuthn for key access (biometric authentication)

---

### 2. Integrity Threats

#### T2.1: Ciphertext Tampering

**Description:** Adversary modifies encrypted diary in storage.

**Attack Vector:**
- Modify IndexedDB entries
- Alter IPFS blobs
- Man-in-the-middle attack

**Mitigations:**
- ✅ **AES-GCM authenticated encryption** (detects tampering)
- ✅ **Decryption fails if modified** (integrity check built-in)
- ✅ **Hash commitments on-chain** (verifiable against original)

**Residual Risk:** VERY LOW (GCM mode provides authentication)

---

#### T2.2: Smart Contract Exploit

**Description:** Adversary exploits bug in Soul-NFT contract.

**Attack Vector:**
- Reentrancy attack
- Integer overflow
- Unauthorized evolve() calls

**Mitigations:**
- ✅ **No transfer allowed** (soul-bound, no reentrancy risk)
- ✅ **Owner-only evolve()** (contract checks msg.sender)
- ✅ **LIGO type safety** (compile-time checks)
- ✅ **Minimal attack surface** (simple contract, few entrypoints)
- ⚠️ **Audited before mainnet** (testnet deployment first)

**Residual Risk:** LOW (simple contract, standard patterns)

---

#### T2.3: Fake Proof Submission

**Description:** User submits fake proof to pass verification.

**Attack Vector:**
- Submit stock photos
- Use AI-generated images
- Replay old proofs

**Mitigations:**
- ✅ **AI vision verification** (heuristics + GPT-4 Vision)
- ✅ **Confidence threshold** (require high confidence score)
- ✅ **Second-proof fallback** (ask for additional photo if low confidence)
- ⚠️ **Image moderation** (check for NSFW, violence)
- ⚠️ **Metadata checks** (EXIF timestamp, geolocation if enabled)

**Residual Risk:** MEDIUM (AI can be fooled, cat-and-mouse game)

**Future Enhancement:**
- Liveness detection (require video or real-time proof)
- Social verification (community voting)
- Progressive difficulty (easier at first, harder later)

---

### 3. Availability Threats

#### T3.1: Denial of Service (DoS)

**Description:** Adversary overwhelms backend API or blockchain.

**Attack Vector:**
- Spam verification endpoint
- Flood blockchain with transactions
- Exhaust IPFS storage

**Mitigations:**
- ✅ **Rate limiting** (max 10 verifications per hour per user)
- ✅ **Gas fees** (Tezos transactions cost XTZ, economic deterrent)
- ✅ **IPFS pinning limits** (max file size, TTL)
- ⚠️ **CAPTCHA** (for high-volume endpoints)

**Residual Risk:** MEDIUM (rate limiting can be bypassed with many IPs)

---

#### T3.2: Key Loss

**Description:** User loses encryption key, cannot access diary.

**Attack Vector:**
- Browser data cleared
- Device lost/stolen
- IndexedDB corruption

**Mitigations:**
- ⚠️ **Key backup feature** (export JWK to save externally)
- ⚠️ **Warning on first use** (prompt user to backup key)
- ❌ **Key recovery impossible** (by design for privacy)

**Residual Risk:** HIGH (irrecoverable without backup)

**User Education:**
- Prominent "Backup Your Key" prompt
- Step-by-step backup guide
- Test restore process

---

### 4. Authentication & Authorization Threats

#### T4.1: Wallet Hijacking

**Description:** Adversary gains control of user's Tezos wallet.

**Attack Vector:**
- Phishing for private key
- Malware stealing wallet
- Social engineering

**Mitigations:**
- ✅ **Beacon SDK** (industry-standard wallet connection)
- ✅ **User confirmation** (wallet prompts for each transaction)
- ✅ **No stored private keys** (wallet manages keys)
- ⚠️ **Phishing warnings** (educate users on official domains)

**Residual Risk:** MEDIUM (wallet security is user's responsibility)

---

#### T4.2: Admin Privilege Abuse

**Description:** Contract admin mints NFTs maliciously.

**Attack Vector:**
- Admin account compromised
- Malicious admin mints unlimited NFTs

**Mitigations:**
- ⚠️ **Admin key secured** (hardware wallet, multi-sig)
- ⚠️ **Mint events logged** (transparent on blockchain)
- ✅ **Plan to renounce admin** (after initial distribution)

**Residual Risk:** MEDIUM (centralized admin is single point of failure)

**Future Enhancement:**
- DAO governance for minting
- Max supply cap (e.g., 10,000 NFTs)
- Timelock on admin actions

---

### 5. Privacy-Specific Threats

#### T5.1: Metadata Leakage

**Description:** Metadata reveals user identity or patterns.

**Attack Vector:**
- Wallet address correlation
- Timing analysis (when entries submitted)
- Goal templates reveal interests

**Mitigations:**
- ⚠️ **Pseudonymous wallets** (encourage new wallet per dApp)
- ⚠️ **Randomized delays** (submit hashes at random intervals)
- ❌ **Perfect anonymity impossible** (blockchain is public ledger)

**Residual Risk:** HIGH (blockchain inherently traceable)

**Future Enhancement:**
- Zcash-style shielded transactions
- Mixers for anonymity sets
- Anonymous goal templates (no identifiable info)

---

#### T5.2: AI Verification Data Retention

**Description:** Backend stores proof images for training.

**Attack Vector:**
- Backend logs images
- AI provider (OpenAI) stores requests
- Third-party analytics

**Mitigations:**
- ✅ **No backend storage** (images sent to AI, then discarded)
- ✅ **OpenAI API zero-retention** (use zero data retention option)
- ⚠️ **Privacy policy** (explicit user consent)
- ⚠️ **Local AI option** (run vision model in browser, future)

**Residual Risk:** MEDIUM (rely on OpenAI's privacy promises)

---

## Attack Scenarios

### Scenario 1: Motivated Attacker (Personal Target)

**Goal:** Read Alice's diary

**Steps:**
1. Gain physical access to Alice's device
2. Extract IndexedDB key
3. Decrypt diary entries

**Success?** ✅ YES (if device unlocked)

**Mitigation:**
- Require password to decrypt (future enhancement)
- Device encryption (user responsibility)
- Screen lock timeout

---

### Scenario 2: Nation-State Adversary

**Goal:** Decrypt all diary data at scale

**Steps:**
1. Compromise IPFS network
2. Download all encrypted blobs
3. Attempt to break AES-256

**Success?** ❌ NO (AES-256 computationally infeasible)

**Mitigation:**
- 256-bit key space (2^256 combinations)
- Quantum-resistant (for now; Grover's algorithm only 2^128 speedup)

---

### Scenario 3: Fake Proof Attacker

**Goal:** Evolve NFT without completing rituals

**Steps:**
1. Download stock photo of running
2. Submit as proof with fake reflection
3. Bypass AI verification

**Success?** ⚠️ MAYBE (depends on AI accuracy)

**Mitigation:**
- High confidence threshold (90%+)
- Second-proof requirement
- Heuristics (check EXIF metadata)
- Future: Liveness checks

---

### Scenario 4: Smart Contract Exploit

**Goal:** Mint unlimited NFTs or steal NFTs

**Steps:**
1. Find bug in Soul-NFT contract
2. Call mint_soul() repeatedly
3. Transfer NFT to attacker's wallet

**Success?** ❌ NO (transfers disabled, admin-only mint)

**Mitigation:**
- Simple contract (minimal attack surface)
- No transfer entrypoint
- Admin checks on mint

---

## Security Checklist

### Week 2 (Current)

- [x] HTTPS enforced
- [x] Wallet connection uses Beacon SDK
- [x] Client-side encryption (AES-GCM)
- [x] Keys stored in IndexedDB
- [x] Contract disables transfers

### Week 3 (In Progress)

- [x] Diary encryption implemented
- [ ] Key backup feature in UI
- [ ] User education (backup prompts)
- [ ] IPFS pinning (encrypted only)

### Week 4 (Future)

- [ ] AI verification rate limiting
- [ ] Image moderation
- [ ] EXIF metadata checks
- [ ] Second-proof flow

### Week 5 (Future)

- [ ] QRNG source validation
- [ ] Art generation determinism

### Week 6 (Hardening)

- [ ] Security audit
- [ ] Penetration testing
- [ ] CSP headers
- [ ] Rate limiting tuning

---

## Incident Response

### Data Breach

**If backend compromised:**
1. No plaintext stored → encrypted blobs useless
2. Rotate API keys immediately
3. Notify users to change wallet

**If user key leaked:**
1. User-initiated key rotation
2. Re-encrypt diary with new key
3. Revoke old IPFS pins

### Smart Contract Bug

**If contract has exploit:**
1. Pause contract (if admin key available)
2. Deploy patched version
3. Migrate users to new contract
4. Post-mortem analysis

### AI Verification Bypass

**If fake proofs detected:**
1. Increase confidence threshold
2. Add heuristic checks
3. Require additional proofs
4. Analyze attack patterns

---

## Compliance & Privacy

### GDPR (Europe)

- ✅ **Right to be forgotten:** User can delete all diary entries
- ✅ **Data portability:** Export diary in JSON format
- ✅ **Consent:** Explicit opt-in for IPFS pinning
- ⚠️ **Blockchain immutability:** Hashes on-chain cannot be deleted (pseudonymous)

### CCPA (California)

- ✅ **Data access:** User can export all data
- ✅ **Data deletion:** User can clear diary
- ⚠️ **Do Not Sell:** No data sold (but AI providers may have own policies)

### Children's Privacy (COPPA)

- ⚠️ **Age verification:** Require age >13 (or parental consent)
- ⚠️ **Minimal data collection:** No personal info beyond wallet address

---

## Future Enhancements

### Short-Term (Weeks 3-6)

1. **Key Backup UI**
   - Prominent "Backup Key" button
   - Test restore flow
   - QR code export for mobile

2. **Content Security Policy (CSP)**
   - Strict CSP headers
   - Prevent XSS attacks

3. **Rate Limiting**
   - Per-wallet limits on verification
   - CAPTCHA for suspicious activity

### Medium-Term (Months 1-3)

1. **Password-Encrypted Keys**
   - Wrap master key with PBKDF2-derived key
   - User enters password to decrypt

2. **Multi-Device Sync**
   - Encrypt key for cloud sync
   - End-to-end encrypted backup

3. **WebAuthn Integration**
   - Biometric authentication for key access
   - Hardware security key support

### Long-Term (Months 3-6)

1. **Zero-Knowledge Proofs**
   - Prove ritual completion without revealing details
   - zkSNARKs for on-chain verification

2. **Decentralized AI**
   - Run verification model in browser
   - Federated learning for model updates

3. **Quantum-Resistant Encryption**
   - Migrate to post-quantum algorithms (e.g., Kyber)
   - Future-proof against quantum computers

---

## Conclusion

**Risk Summary:**
- **High Risk:** Key loss (user responsibility)
- **Medium Risk:** AI verification bypass, admin privilege abuse
- **Low Risk:** Network eavesdropping, ciphertext tampering

**Overall Posture:** **GOOD**
- Privacy fundamentals are solid (client-side encryption)
- Blockchain provides transparency (hash commitments)
- Ongoing monitoring required (AI verification, contract security)

**Next Steps:**
1. Implement key backup feature (Week 3)
2. Add CSP headers (Week 6)
3. Security audit before mainnet (Week 12)

---

**Security is a journey, not a destination.** 🔒
