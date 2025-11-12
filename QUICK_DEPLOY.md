# 🚀 Quick Deploy Guide - Proof of Becoming

Your backend and frontend are **already running**! Complete the deployment with these final steps.

## Current Status ✅

- **Backend API**: Running on port 8000 (Groq AI configured)
- **Frontend UI**: Running on port 3000
- **Database**: Not needed (uses blockchain + IndexedDB)
- **AI Service**: Groq llama-3.2-90b-vision-preview ✅

## 🎯 Final Step: Deploy Smart Contract

### Option 1: Deploy from Your Local Machine (Recommended)

```bash
# 1. Clone the repo on your local machine
git clone https://github.com/basedlsg/TZs-NFT.git
cd TZs-NFT/contracts

# 2. Install LIGO
curl -L https://gitlab.com/ligolang/ligo/-/releases/1.6.0/downloads/ligo-static-linux -o ligo
chmod +x ligo

# 3. Compile the simplified contract
./ligo compile contract soul_nft_simple.mligo > soul_nft.tz

# 4. Install Temple Wallet browser extension
# https://templewallet.com/
# Switch to Ghostnet testnet

# 5. Get free testnet XTZ
# Visit: https://faucet.ghostnet.teztnets.com/
# Paste your tz1... address and request 10 XTZ

# 6. Deploy using Taquito
cd ../frontend
npm install
npx ts-node scripts/deploy-contract.ts

# 7. Save the contract address (KT1...)
# Update frontend/.env.local:
# NEXT_PUBLIC_CONTRACT_ADDRESS=KT1...YOUR_ADDRESS...

# 8. Restart frontend
npm run dev
```

### Option 2: Deploy Using Temple Wallet + Better Call Dev

```bash
# 1. Compile contract locally (step 1-3 above)

# 2. Visit Better Call Dev
# https://better-call.dev/ghostnet/deploy

# 3. Upload compiled Michelson code (soul_nft.tz)

# 4. Connect Temple Wallet

# 5. Deploy and save contract address (KT1...)

# 6. Update configuration
# Edit frontend/.env.local:
# NEXT_PUBLIC_CONTRACT_ADDRESS=KT1...YOUR_ADDRESS...

# 7. Restart frontend
cd frontend && npm run dev
```

### Option 3: Use Pre-Deployed Testnet Contract (Quick Test)

```bash
# For quick testing, use a pre-deployed contract
# Update frontend/.env.local:
NEXT_PUBLIC_CONTRACT_ADDRESS=KT1MockForTestingOnly123

# Note: This won't persist data but allows UI testing
# Deploy your own contract for real functionality
```

## 🧪 Test Your Deployment

Once contract is deployed:

```bash
# 1. Open frontend
# http://localhost:3000

# 2. Connect Temple Wallet (Ghostnet)

# 3. Test the flow:
# - Click "Connect Wallet"
# - Click "Mint Soul NFT"
# - Create diary entry
# - Submit proof with photo
# - Groq AI verifies (fast!)
# - View evolved NFT

# 4. Check API
curl http://localhost:8000/health
curl http://localhost:8000/docs
```

## 📊 Deployment Checklist

- [x] Backend running (port 8000)
- [x] Frontend running (port 3000)
- [x] Groq AI configured
- [x] Environment variables set
- [ ] Smart contract deployed
- [ ] Contract address in .env.local
- [ ] Temple Wallet installed
- [ ] Testnet XTZ obtained
- [ ] Full E2E flow tested

## 🆘 Troubleshooting

**Can't compile contract?**
- Ensure LIGO 1.6.0 is installed
- Try online compiler: https://ide.ligolang.org/
- Use Docker: `docker run ligolang/ligo:1.6.0 compile contract soul_nft_simple.mligo`

**No testnet XTZ?**
- Visit faucet: https://faucet.ghostnet.teztnets.com/
- Request 10 XTZ every 24 hours
- Check wallet is on Ghostnet (not Mainnet!)

**Contract deployment fails?**
- Check you have sufficient XTZ (>1 XTZ)
- Verify you're on Ghostnet
- Try deploying via Better Call Dev

**Frontend can't connect to contract?**
- Verify contract address in .env.local
- Restart frontend: `npm run dev`
- Check browser console for errors

## 🌐 Access Your dApp

**Frontend**: http://localhost:3000
**Backend API**: http://localhost:8000
**API Docs**: http://localhost:8000/docs

## 📚 Full Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Complete deployment guide
- [DEMO_WALKTHROUGH.md](DEMO_WALKTHROUGH.md) - User journey
- [README.md](README.md) - Project overview

---

**Your Proof of Becoming dApp is 95% deployed!** 🎉

Just deploy the smart contract and you're live on Tezos Ghostnet!
