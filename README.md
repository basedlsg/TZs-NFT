# Proof of Becoming (PoB)

**A Tezos/Etherlink dApp for private ritual journaling → goal setting → proof submission → AI verification → evolving Soul NFTs.**

---

## 🎯 What is Proof of Becoming?

Proof of Becoming lets users:
1. **Set a personal goal** (e.g., "Run 5km", "Read 20 pages")
2. **Submit proof** (photo + reflection) stored privately
3. **Get verified** by AI (heuristics + vision model)
4. **Evolve their Soul-NFT** on-chain with quantum-seeded generative art

**Privacy-first:** Your diary stays client-side or encrypted on IPFS. Only commitments go on-chain.

---

## 🏗 Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Next.js    │─────▶│ Verify API   │─────▶│  QRNG API   │
│  Frontend   │      │  (FastAPI)   │      │             │
└──────┬──────┘      └──────────────┘      └─────────────┘
       │
       │ Taquito/Beacon
       ▼
┌─────────────┐      ┌──────────────┐
│  Tezos L1   │◀────▶│  Etherlink   │
│  (Ghostnet) │      │  (L2 Testnet)│
└─────────────┘      └──────────────┘
       │
       ▼
   IPFS (encrypted diary blobs)
```

---

## 📦 Repository Structure

```
TZs-NFT/
├── frontend/          # Next.js app (wallet, UI, encryption)
├── contracts/         # LIGO FA2 Soul-NFT
├── backend/           # FastAPI verification API
├── docs/              # Architecture, ADRs, guides
├── SOURCES/           # Research citations
├── DECISIONS/         # Architectural Decision Records
├── CHECKLISTS/        # PR and review checklists
└── tests/             # E2E and integration tests
```

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ (for backend)
- Docker (optional, for IPFS node)

### 1. Clone & Install

```bash
git clone <repo-url>
cd TZs-NFT
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with your Tezos testnet RPC, IPFS endpoint, etc.
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env
# Edit .env with AI API keys, QRNG keys, etc.
uvicorn main:app --reload
```

API available at [http://localhost:8000](http://localhost:8000)

### 4. Contract Deploy (Testnet)

```bash
cd contracts
# Install LIGO
curl https://gitlab.com/ligolang/ligo/-/releases/1.6.0/downloads/ligo-static-linux -o ligo
chmod +x ligo

# Compile
./ligo compile contract soul_nft.mligo > soul_nft.tz

# Deploy to Ghostnet (requires tezos-client or Taquito script)
# See contracts/README.md for details
```

---

## 🧪 Testing

```bash
# Frontend unit tests
cd frontend && npm test

# Frontend E2E (Playwright)
npm run test:e2e

# Backend tests
cd backend && pytest

# Contract tests
cd contracts && npm run test
```

---

## 🔐 Security & Privacy

- **Client-side AES-GCM encryption** for diary entries
- **Keys never leave your browser** (IndexedDB storage)
- **On-chain:** Only hash commitments, never plaintext
- **IPFS:** Only encrypted blobs pinned (optional)
- **Rate-limited API** to prevent abuse
- **Image moderation** on proof uploads

See [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) for details.

---

## 📋 Roadmap

- [x] **Week 1:** Scoping & skeleton
- [x] **Week 2:** Wallet connect + FA2 contract + Backend scaffold ← **You are here**
- [ ] **Week 3:** Private journal + encryption
- [ ] **Week 4:** Proof submission + AI verify
- [ ] **Week 5:** Generative NFT art
- [ ] **Week 6:** Hardening + testnet demo

See [Proof-of-Becoming.claudemd](Proof-of-Becoming.claudemd) for full plan.

---

## 🤝 Contributing

1. Read [CHECKLISTS/PR_CHECKLIST.md](CHECKLISTS/PR_CHECKLIST.md)
2. Follow [RESEARCH_PROTOCOL.md](RESEARCH_PROTOCOL.md) for sourcing decisions
3. Keep PRs small (≤ 200–300 LOC)
4. Write tests first
5. No mock data in production code

---

## 📚 Documentation

- [Proof-of-Becoming.claudemd](Proof-of-Becoming.claudemd) — Build plan
- [CHECKLISTS/PR_CHECKLIST.md](CHECKLISTS/PR_CHECKLIST.md) — PR review guide
- [RESEARCH_PROTOCOL.md](RESEARCH_PROTOCOL.md) — How we research & document
- `docs/` — ADRs, threat model, user guides

---

## 📜 License

MIT (or specify your license)

---

## 🙏 Acknowledgments

Built with:
- [Tezos](https://tezos.com) — L1 blockchain
- [Etherlink](https://www.etherlink.com/) — EVM-compatible L2
- [Taquito](https://tezostaquito.io/) — Tezos SDK
- [LIGO](https://ligolang.org/) — Smart contract language
- [Next.js](https://nextjs.org/) — React framework
- [FastAPI](https://fastapi.tiangolo.com/) — Python API framework
