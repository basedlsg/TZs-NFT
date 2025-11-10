# Contract Deployment Guide

This guide walks through deploying the Soul-NFT contract to Tezos Ghostnet (testnet) or Mainnet.

---

## Prerequisites

### 1. Get a Deployer Wallet

You need a Tezos wallet with some XTZ for gas fees.

**For Ghostnet (Testnet):**
- Create wallet using Temple Wallet or tezos-client
- Get free testnet XTZ from [Ghostnet Faucet](https://faucet.ghostnet.teztnets.com/)
- Minimum: ~1 XTZ (deployment costs ~0.5-1 XTZ)

**For Mainnet:**
- Use a secure wallet with real XTZ
- Minimum: ~5-10 XTZ (for deployment + buffer)

### 2. Export Private Key

**⚠️ SECURITY WARNING:** Never commit private keys to git or share them publicly!

**From Temple Wallet:**
1. Open Temple Wallet
2. Click account name → Settings → Reveal Private Key
3. Enter password and copy the private key (starts with `edsk...`)

**From tezos-client:**
```bash
tezos-client show address <your-account> -S
```

### 3. Set Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```bash
# Deployment credentials (NEVER commit this file!)
DEPLOYER_PRIVATE_KEY=edsk...your_private_key_here

# Admin address (will own the contract and can mint NFTs)
ADMIN_ADDRESS=tz1YourAdminAddressHere

# Network
NEXT_PUBLIC_TEZOS_RPC_URL=https://ghostnet.tezos.marigold.dev
NEXT_PUBLIC_NETWORK=ghostnet
```

**Add to `.gitignore`:**
```bash
echo ".env.local" >> .gitignore
```

---

## Option 1: Deploy Using Taquito Script (Recommended for MVP)

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Prepare Compiled Contract

The deployment script expects a compiled contract at `contracts/build/soul_nft.tz`.

**Quick Start (Use Pre-compiled):**

For the MVP, use this minimal Michelson contract (save to `contracts/build/soul_nft.tz`):

```michelson
parameter (or (pair %mint_soul address string)
              (or (pair %evolve (nat %token_id) (nat %stage) (string %seed) (string %metadata_uri))
                  (pair %balance_of (list (pair address nat)) (contract (list (pair (pair address nat) nat))))));

storage (pair (address %admin)
              (pair (nat %next_token_id)
                    (pair (big_map %ledger address nat)
                          (pair (big_map %token_metadata nat (pair nat (map string bytes)))
                                (big_map %metadata string bytes)))));

code { ... };  # Full code in contracts/build/soul_nft.tz
```

**Or Compile from LIGO (if LIGO is installed):**

```bash
cd contracts
npm run compile
```

### Step 3: Deploy

```bash
cd frontend
npm run deploy:contract -- --network ghostnet --admin $ADMIN_ADDRESS
```

**Expected Output:**
```
Deploying to ghostnet...
Admin address: tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb
Originating contract...
Waiting for confirmation...
Operation hash: ooAbC1234...
✅ Contract deployed successfully!
Contract address: KT1AbC123XYZ...
Explorer: https://ghostnet.tzkt.io/KT1AbC123XYZ...
✅ Contract address saved to .env.local
```

### Step 4: Verify Deployment

1. **Check Explorer:**
   - Open the explorer link shown in output
   - Verify contract storage shows your admin address
   - Check `next_token_id` is 0

2. **Test Contract Call (Optional):**
   ```bash
   # Using Taquito (see frontend/lib/soulNFT.ts in next PR)
   ```

---

## Option 2: Deploy Using Tezos CLI

### Step 1: Install tezos-client

**macOS:**
```bash
brew install tezos-client
```

**Linux (Ubuntu/Debian):**
```bash
sudo add-apt-repository ppa:serokell/tezos
sudo apt-get update
sudo apt-get install tezos-client
```

### Step 2: Configure Client

```bash
# Set RPC endpoint
tezos-client --endpoint https://ghostnet.tezos.marigold.dev config update

# Import your deployer key
tezos-client import secret key deployer unencrypted:edsk...your_key

# Check balance
tezos-client get balance for deployer
```

### Step 3: Originate Contract

```bash
cd contracts

# Compile contract first (if using LIGO)
npm run compile

# Originate with initial storage
tezos-client originate contract soul_nft \
  transferring 0 from deployer \
  running build/soul_nft.tz \
  --init '(Pair "tz1YourAdminAddress" (Pair 0 (Pair {} (Pair {} {}))))' \
  --burn-cap 1.0
```

**Expected Output:**
```
New contract KT1... originated.
The operation has been included in block BL...
Contract address: KT1AbC123XYZ...
```

### Step 4: Save Contract Address

Manually add to `frontend/.env.local`:
```bash
NEXT_PUBLIC_SOUL_NFT_CONTRACT=KT1AbC123XYZ...
```

---

## Deployment Checklist

Before deploying to Mainnet, verify:

- [ ] Contract compiled successfully
- [ ] Initial storage uses correct admin address
- [ ] Deployer wallet has sufficient XTZ
- [ ] Private key is secured (not in git)
- [ ] Contract tested on Ghostnet first
- [ ] Explorer shows contract with correct storage
- [ ] Contract address saved in `.env.local`

---

## Estimated Costs

| Network | Storage Fees | Gas | Total (approx) |
|---------|--------------|-----|----------------|
| Ghostnet | ~0.3 XTZ | ~0.1 XTZ | ~0.5 XTZ |
| Mainnet | ~0.5 XTZ | ~0.2 XTZ | ~1.0 XTZ |

*Costs vary based on contract size and network congestion*

---

## Troubleshooting

### Error: "Insufficient funds"
**Solution:** Add more XTZ to deployer wallet from faucet (testnet) or buy XTZ (mainnet).

### Error: "Invalid storage expression"
**Solution:** Verify admin address is valid Tezos address starting with `tz1`, `tz2`, or `tz3`.

### Error: "Contract code too large"
**Solution:** Optimize contract code or split into multiple contracts. (Unlikely for this contract)

### Error: "Operation failed"
**Check:**
- RPC endpoint is reachable
- Deployer key has correct permissions
- Network is not congested (try increasing burn-cap)

---

## Post-Deployment

### Update Frontend Config

The deployment script automatically updates `.env.local`, but verify:

```bash
# frontend/.env.local
NEXT_PUBLIC_SOUL_NFT_CONTRACT=KT1YourContractAddressHere
NEXT_PUBLIC_NETWORK=ghostnet
```

### Test Contract Interactions

See `docs/CONTRACT_CALLS.md` (coming in PR #4) for:
- Minting Soul-NFTs
- Evolving metadata
- Reading token data

### Monitor Contract

**Explorers:**
- Ghostnet: https://ghostnet.tzkt.io/
- Mainnet: https://tzkt.io/

**Indexers:**
- Use TzKT API for off-chain queries
- Subscribe to contract events

---

## Security Best Practices

1. **Private Keys:**
   - Never commit to git
   - Use hardware wallet for mainnet
   - Rotate keys after deployment if exposed

2. **Admin Powers:**
   - Admin can mint NFTs (1 per address)
   - Consider multi-sig for production
   - Plan admin key rotation or renouncement

3. **Contract Upgrades:**
   - This contract is NOT upgradeable
   - Deploy new contract if changes needed
   - Migrate user data via separate process

4. **Testing:**
   - Always deploy to Ghostnet first
   - Test all entrypoints before mainnet
   - Verify storage updates correctly

---

## Next Steps

After deployment:

1. **PR #4:** Contract interaction layer (`lib/soulNFT.ts`)
2. **PR #5:** Backend API for verification
3. **Week 3:** IPFS metadata storage
4. **Week 4:** Proof submission + evolve flow

---

## References

- [Tezos Origination Docs](https://tezos.gitlab.io/user/origination.html)
- [Taquito Origination Guide](https://tezostaquito.io/docs/originate)
- [TzKT Explorer](https://tzkt.io/)
- [Ghostnet Faucet](https://faucet.ghostnet.teztnets.com/)
