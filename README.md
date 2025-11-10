<div align="center">

# 🌟 Proof of Becoming (PoB)

**Transform your daily rituals into evolving Soul NFTs with privacy-first journaling**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Built with Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)](https://fastapi.tiangolo.com/)
[![Tezos](https://img.shields.io/badge/Tezos-Ghostnet-2C7DF7)](https://tezos.com/)

[Features](#-features) • [Quick Start](#-quick-start-local-dev) • [Documentation](#-documentation) • [Demo](#-demo) • [Deployment](#-deployment)

</div>

---

## 🎯 What is Proof of Becoming?

Proof of Becoming is a **privacy-first dApp** that transforms your daily rituals and personal growth into evolving Soul NFTs on the Tezos blockchain. Track your goals, submit proof of progress, and watch your unique NFT evolve with each verified achievement.

### How it Works

1. **🎯 Set a personal goal** (e.g., "Run 5km", "Read 20 pages", "Meditate 10min")
2. **📝 Write a reflection** in your private, encrypted diary
3. **📸 Submit proof** (photo + reflection) verified by AI
4. **🎨 Evolve your Soul-NFT** with quantum-seeded generative art
5. **🖼️ View your gallery** of achievements and NFT evolution

**Privacy-first:** Your diary stays client-side or encrypted on IPFS. Only hash commitments go on-chain, never your personal data.

---

## ✨ Features

### 🔐 Privacy & Security
- **Client-side AES-256-GCM encryption** for all diary entries
- **Zero-knowledge architecture**: Keys never leave your browser
- **On-chain commitments only**: Personal data never stored publicly
- **Rate limiting & input validation** to prevent abuse
- **Optional IPFS**: Encrypted blobs only, with graceful fallback to IndexedDB

### 🤖 AI-Powered Verification
- **GPT-4 Vision API** for intelligent photo verification
- **Heuristic checks** for goal-proof alignment
- **Confidence scoring** with detailed feedback
- **Retry logic** with exponential backoff for reliability

### 🎨 Generative NFT Art
- **Quantum random seeds** from ANU Quantum RNG
- **Deterministic generation**: Same seed = same art (reproducible)
- **SVG-based artwork** stored on-chain or IPFS
- **Evolution tracking**: NFTs grow with your journey

### 🌐 Tezos Integration
- **FA2 Soul-NFT contract** (TZIP-12 standard)
- **Beacon wallet** support (Temple, Kukai, etc.)
- **Ghostnet testnet** ready, mainnet compatible
- **Low transaction costs** on Tezos L1

### 🛠️ Developer-Friendly
- **98+ comprehensive tests** (unit, integration, E2E)
- **Complete documentation** with deployment guides
- **Docker support** for easy deployment
- **Type-safe** TypeScript + Python codebase

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

### 4. IPFS Setup (Optional)

**For Local Development:**

```bash
# Install IPFS Desktop or Kubo CLI
# https://docs.ipfs.tech/install/

# Start IPFS daemon
ipfs daemon

# Verify it's running
curl http://127.0.0.1:5001/api/v0/version
```

**For Production (Infura or Pinata):**

```bash
# Option 1: Infura IPFS
# Sign up at https://infura.io
# Add to backend/.env:
IPFS_API_URL=https://ipfs.infura.io:5001
IPFS_PROJECT_ID=your_project_id
IPFS_PROJECT_SECRET=your_secret

# Option 2: Pinata
# Sign up at https://pinata.cloud
# Add to backend/.env:
IPFS_API_URL=https://api.pinata.cloud
PINATA_API_KEY=your_api_key
PINATA_SECRET_KEY=your_secret
```

**Note:** IPFS is optional. Users can use local IndexedDB storage only. See [docs/IPFS.md](docs/IPFS.md) for details.

### 5. Contract Deploy (Testnet)

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
- [x] **Week 2:** Wallet connect + FA2 contract + Backend scaffold
- [x] **Week 3:** Client-side encryption + IPFS integration
- [x] **Week 4:** Proof submission + AI verification
- [x] **Week 5:** Generative NFT art + QRNG
- [x] **Week 6:** Hardening + testnet deployment ← **✅ COMPLETE**

**Current Status**: MVP complete and production-ready!

See [Proof-of-Becoming.claudemd](Proof-of-Becoming.claudemd) for full build plan.

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Utility-first styling
- **Taquito** - Tezos blockchain SDK
- **Beacon SDK** - Wallet connection
- **Web Crypto API** - AES-256-GCM encryption
- **IndexedDB** - Secure local storage

### Backend
- **FastAPI** - High-performance Python API
- **Pydantic** - Data validation
- **slowapi** - Rate limiting middleware
- **httpx** - Async HTTP client
- **pytest** - Testing framework
- **OpenAI API** - GPT-4 Vision for verification

### Blockchain & Storage
- **Tezos** - L1 blockchain (Ghostnet/Mainnet)
- **LIGO** - Smart contract language
- **IPFS** - Decentralized storage (optional)
- **ANU QRNG** - Quantum random number generation

### DevOps & Testing
- **Docker** - Containerization
- **Jest** - Frontend testing
- **Playwright** - E2E testing
- **GitHub Actions** - CI/CD (optional)

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. **Read the docs**: Start with [CHECKLISTS/PR_CHECKLIST.md](CHECKLISTS/PR_CHECKLIST.md)
2. **Research protocol**: Follow [RESEARCH_PROTOCOL.md](RESEARCH_PROTOCOL.md) for decisions
3. **Small PRs**: Keep changes focused (≤ 200–300 LOC)
4. **Test-Driven**: Write tests before implementation
5. **No mocks in prod**: Use real implementations, graceful fallbacks

### Development Workflow

```bash
# 1. Fork and clone
git clone https://github.com/your-username/TZs-NFT.git

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and test
npm test  # Frontend
pytest    # Backend

# 4. Commit with clear messages
git commit -m "feat: Add feature description"

# 5. Push and create PR
git push origin feature/your-feature-name
```

---

## 📚 Documentation

### Getting Started
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Complete deployment guide (testnet & production)
- **[DEMO_WALKTHROUGH.md](DEMO_WALKTHROUGH.md)** — User journey walkthrough with screenshots
- [Proof-of-Becoming.claudemd](Proof-of-Becoming.claudemd) — Full build plan and architecture

### Developer Guides
- [docs/ENCRYPTION.md](docs/ENCRYPTION.md) — Client-side encryption implementation
- [docs/IPFS.md](docs/IPFS.md) — IPFS integration guide
- [docs/THREAT_MODEL.md](docs/THREAT_MODEL.md) — Security threat model
- [RESEARCH_PROTOCOL.md](RESEARCH_PROTOCOL.md) — Research & documentation process
- [CHECKLISTS/PR_CHECKLIST.md](CHECKLISTS/PR_CHECKLIST.md) — PR review checklist

### Technical Documentation
- `docs/` — Architecture Decision Records (ADRs)
- `DECISIONS/` — Detailed technical decisions
- `SOURCES/` — Research citations and references

---

## 🎬 Demo

**[View the Demo Walkthrough →](DEMO_WALKTHROUGH.md)**

The demo walkthrough includes:
- Complete user journey from wallet setup to NFT evolution
- Phase-by-phase instructions with visual guides
- Privacy features explained (client-side encryption)
- Technical deep-dives (QRNG, deterministic art)
- Troubleshooting common issues

---

## 🚀 Deployment

Ready to deploy? See **[DEPLOYMENT.md](DEPLOYMENT.md)** for comprehensive guides on:

- **Testnet Deployment** (Ghostnet) - Free testing environment
- **Production Deployment** - Mainnet ready with security checklist
- **Backend Options** - Local, Gunicorn, Docker, cloud platforms
- **Frontend Options** - Vercel, Netlify, static export
- **IPFS Setup** - Local node, Pinata, or Infura
- **Smart Contract** - Deploy to Tezos with Taquito

### Quick Deploy Links

```bash
# Deploy backend to Docker
docker build -t pob-backend backend/
docker run -p 8000:8000 pob-backend

# Deploy frontend to Vercel
cd frontend && vercel deploy
```

---

## 📊 Project Stats

- **98+ Tests** - Comprehensive test coverage (unit, integration, E2E)
- **Production-Ready** - Complete with error handling, rate limiting, retry logic
- **Privacy-First** - Client-side encryption, zero-knowledge architecture
- **Well-Documented** - 1000+ lines of deployment and user guides
- **Type-Safe** - TypeScript frontend + Pydantic backend
- **6 Week Build** - From concept to production-ready MVP

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details

---

## 🙏 Acknowledgments

### Built With

**Blockchain & Smart Contracts**
- [Tezos](https://tezos.com) - Energy-efficient L1 blockchain
- [Taquito](https://tezostaquito.io/) - Tezos JavaScript SDK
- [Beacon SDK](https://www.walletbeacon.io/) - Wallet connection protocol
- [LIGO](https://ligolang.org/) - Smart contract language

**Frontend**
- [Next.js](https://nextjs.org/) - React framework by Vercel
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python API framework
- [OpenAI](https://openai.com/) - GPT-4 Vision API
- [ANU QRNG](https://qrng.anu.edu.au/) - Quantum Random Number Generator

**Storage & Infrastructure**
- [IPFS](https://ipfs.tech/) - Decentralized storage protocol
- [Pinata](https://pinata.cloud/) - IPFS pinning service
- [Docker](https://www.docker.com/) - Containerization platform

### Special Thanks

- **Tezos Foundation** - For building a sustainable blockchain
- **OpenAI** - For GPT-4 Vision API capabilities
- **ANU Quantum Optics Group** - For providing public QRNG API
- **Web3 Community** - For privacy-first dApp inspiration

---

<div align="center">

**[⬆ Back to Top](#-proof-of-becoming-pob)**

Made with ❤️ for personal growth and privacy

</div>
