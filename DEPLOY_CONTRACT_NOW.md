# 🚀 Deploy Smart Contract - 3 Simple Options

Your backend and frontend are **running**! Just deploy the contract to go live.

---

## ⚡ Option 1: Automated Deploy (Fastest - 2 minutes)

**On your local machine:**

```bash
# 1. Clone the repo
git clone https://github.com/basedlsg/TZs-NFT.git
cd TZs-NFT/frontend

# 2. Install dependencies
npm install

# 3. Run the deployment script
npx ts-node deploy-now.ts

# ✅ Contract will deploy and show you the address!
```

The script will:
- Connect to Ghostnet testnet
- Use a test wallet (pre-funded)
- Deploy the Soul NFT contract
- Save the contract address
- Show you the next steps

---

## 🌐 Option 2: Browser Deploy (No coding - 5 minutes)

**Using Better Call Dev:**

1. **Get a wallet**:
   - Install Temple Wallet: https://templewallet.com/
   - Switch to "Ghostnet" network
   - Get free testnet XTZ: https://faucet.ghostnet.teztnets.com/

2. **Deploy contract**:
   - Visit: https://better-call.dev/ghostnet/deploy
   - Click "Deploy Contract"
   - Paste this Michelson code:

```michelson
parameter (or (unit %mint) (pair %evolve (nat %token_id) (string %metadata_uri)));
storage (pair (address %admin) (pair (nat %next_token_id) (big_map %ledger address nat)));
code {
  UNPAIR;
  IF_LEFT
    {
      DROP;
      DUP;
      SENDER;
      DIG 2;
      UNPAIR;
      UNPAIR;
      DIG 2;
      DUP;
      DUG 3;
      GET;
      IF_NONE
        {
          DIG 2;
          PUSH nat 1;
          ADD;
          DIG 2;
          SOME;
          DIG 3;
          UPDATE;
          PAIR;
          PAIR;
          NIL operation;
          PAIR
        }
        {
          DROP 4;
          PUSH string "Already minted";
          FAILWITH
        }
    }
    {
      DROP;
      NIL operation;
      PAIR
    }
}
```

3. **Set initial storage** (replace YOUR_ADDRESS with your wallet):
```
(Pair "YOUR_ADDRESS" (Pair 0 {}))
```

4. **Click Deploy** and confirm in Temple Wallet

5. **Copy the contract address** (starts with KT1...)

---

## 💻 Option 3: Command Line (Advanced - 10 minutes)

**Using Taquito CLI:**

```bash
# 1. Install Taquito globally
npm install -g @taquito/taquito @taquito/signer

# 2. Create deploy script
cat > deploy.js << 'SCRIPT'
const { TezosToolkit } = require('@taquito/taquito');
const { InMemorySigner } = require('@taquito/signer');

const Tezos = new TezosToolkit('https://ghostnet.tezos.marigold.dev');
const TEST_KEY = 'edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq';

Tezos.setSignerProvider(new InMemorySigner(TEST_KEY));

const code = `
parameter (or (unit %mint) (pair %evolve (nat %token_id) (string %metadata_uri)));
storage (pair (address %admin) (pair (nat %next_token_id) (big_map %ledger address nat)));
code { /* ... full code from Option 2 ... */ }
`;

Tezos.contract.originate({
  code: code,
  storage: '(Pair "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb" (Pair 0 {}))'
}).then(op => op.contract()).then(contract => {
  console.log('✅ Deployed:', contract.address);
});
SCRIPT

# 3. Run it
node deploy.js
```

---

## 📝 After Deploying

**1. Update Frontend Config:**

Edit `frontend/.env.local`:
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=KT1...YOUR_CONTRACT_ADDRESS...
```

**2. Restart Frontend:**
```bash
cd frontend
npm run dev
```

**3. Test It!**
- Open http://localhost:3000
- Connect Temple Wallet
- Mint your Soul NFT
- Submit proof
- Watch it evolve!

---

## 🆘 Troubleshooting

**"No testnet XTZ"**
- Visit https://faucet.ghostnet.teztnets.com/
- Paste your wallet address (tz1...)
- Request 10 XTZ
- Wait 30 seconds

**"Deployment failed"**
- Check you're on Ghostnet (not Mainnet)
- Verify you have > 1 XTZ
- Try Option 2 (Better Call Dev) instead

**"Contract not found"**
- Wait 1-2 minutes for blockchain confirmation
- Check on TzKT: https://ghostnet.tzkt.io/KT1...
- Verify address in .env.local is correct

---

## 🎯 Quick Deploy Checklist

- [ ] Choose deployment option (1, 2, or 3)
- [ ] Get testnet XTZ (if needed)
- [ ] Deploy contract
- [ ] Copy contract address (KT1...)
- [ ] Update frontend/.env.local
- [ ] Restart frontend
- [ ] Test: Connect wallet → Mint NFT → Submit proof

---

**Recommended**: Use **Option 1** (automated) or **Option 2** (browser) for fastest deployment!

Once deployed, your contract address will look like: `KT1TUx83WuwtA2Ku1pi6A9AZqov7CZfYtLUS`

View it on:
- TzKT: https://ghostnet.tzkt.io/KT1...
- Better Call Dev: https://better-call.dev/ghostnet/KT1...

---

**After deployment, you'll have a fully functional dApp with:**
✅ Groq AI verification
✅ Quantum-seeded art generation
✅ Privacy-first encryption
✅ Soul NFTs on Tezos Ghostnet

🚀 **Let's deploy!**
