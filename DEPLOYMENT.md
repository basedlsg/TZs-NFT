# Deployment Guide - Proof of Becoming

This guide covers deploying the Proof of Becoming dApp to Tezos Ghostnet (testnet) and production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Smart Contract Deployment](#smart-contract-deployment)
6. [IPFS Setup](#ipfs-setup)
7. [Testing Deployment](#testing-deployment)
8. [Production Checklist](#production-checklist)

## Prerequisites

### Required Tools

- **Node.js** v18+ and npm
- **Python** 3.11+
- **Tezos Wallet** (Temple, Kukai) with Ghostnet testnet tokens
- **IPFS** node (local or Pinata/Infura)
- **OpenAI API Key** (optional, for AI verification)

### Get Testnet Tokens

1. Visit [Ghostnet Faucet](https://faucet.ghostnet.teztnets.xyz/)
2. Connect your wallet
3. Request testnet XTZ tokens

## Environment Configuration

### Backend Configuration

Create `backend/.env` file:

```bash
# Server Configuration
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000

# IPFS Configuration
IPFS_API_URL=http://127.0.0.1:5001
IPFS_GATEWAY=https://ipfs.io/ipfs/

# AI Verification (Optional)
OPENAI_API_KEY=sk-your-api-key-here
AI_MODEL=gpt-4-vision-preview

# Production Settings
ENVIRONMENT=production
LOG_LEVEL=INFO
```

### Frontend Configuration

Create `frontend/.env.local` file:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Tezos Network
NEXT_PUBLIC_TEZOS_RPC=https://ghostnet.ecadinfra.com
NEXT_PUBLIC_NETWORK=ghostnet

# Contract Address (update after deployment)
NEXT_PUBLIC_SOUL_NFT_CONTRACT=KT1...

# IPFS Gateway
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

## Backend Deployment

### Option 1: Local Development

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Option 2: Production with Gunicorn

```bash
cd backend

# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Option 3: Docker Deployment

Create `backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:

```bash
docker build -t pob-backend .
docker run -p 8000:8000 --env-file .env pob-backend
```

### Health Check

Verify backend is running:

```bash
curl http://localhost:8000/health

# Expected response:
# {"status":"ok","service":"pob-backend","version":"0.5.0"}
```

## Frontend Deployment

### Option 1: Local Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

### Option 2: Production Build (Vercel/Netlify)

```bash
cd frontend

# Build for production
npm run build

# Start production server
npm start
```

### Option 3: Static Export

```bash
cd frontend

# Build static export
npm run build
npm run export

# Serve the 'out' directory with any static hosting
```

### Deployment Platforms

#### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Configure environment variables
4. Deploy

#### Netlify

1. Push code to GitHub
2. Connect repository in Netlify
3. Set build command: `npm run build`
4. Set publish directory: `.next`
5. Add environment variables
6. Deploy

## Smart Contract Deployment

### Deploy Soul NFT Contract to Ghostnet

```bash
cd frontend

# Compile contract (if using LIGO)
# ligo compile contract contracts/soul_nft.ligo > contracts/soul_nft.tz

# Deploy using Taquito script
npm run deploy:contract

# This will:
# 1. Connect to Ghostnet RPC
# 2. Deploy FA2 token contract
# 3. Initialize with metadata
# 4. Output contract address
```

### Update Frontend Configuration

After deployment, update `frontend/.env.local`:

```bash
NEXT_PUBLIC_SOUL_NFT_CONTRACT=KT1YourDeployedContractAddress
```

### Verify Contract on Ghostnet

Visit: `https://ghostnet.tzkt.io/KT1YourContractAddress`

Check:
- Contract is deployed
- Storage is initialized
- Entrypoints are available

## IPFS Setup

### Option 1: Local IPFS Node

```bash
# Install IPFS
# macOS
brew install ipfs

# Linux
wget https://dist.ipfs.io/go-ipfs/v0.14.0/go-ipfs_v0.14.0_linux-amd64.tar.gz
tar xvfz go-ipfs_v0.14.0_linux-amd64.tar.gz
cd go-ipfs
./install.sh

# Initialize and start
ipfs init
ipfs daemon
```

### Option 2: Pinata (Recommended for Production)

1. Sign up at [Pinata](https://pinata.cloud)
2. Get API keys
3. Update backend configuration:

```python
# backend/api/ipfs.py
PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET = os.getenv("PINATA_SECRET")
```

### Option 3: Infura IPFS

1. Sign up at [Infura](https://infura.io)
2. Create IPFS project
3. Get project ID and secret
4. Update configuration

## Testing Deployment

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run E2E tests
pytest test_e2e.py -v

# Run with coverage
pytest --cov=. --cov-report=html
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# Run E2E tests
npm test -- __tests__/e2e/

# Type checking
npm run typecheck
```

### Integration Testing

Test complete flow on testnet:

1. **Connect Wallet**
   - Open frontend
   - Click "Connect Wallet"
   - Approve connection in Temple/Kukai

2. **Mint Soul NFT**
   - Navigate to mint page
   - Click "Mint Soul NFT"
   - Confirm transaction
   - Wait for confirmation

3. **Create Diary Entry**
   - Go to diary page
   - Select goal
   - Write reflection (20+ chars)
   - Upload image
   - Save entry

4. **Verify Proof**
   - Go to diary history
   - Click "Verify Proof"
   - Submit for verification
   - Check confidence score

5. **Evolve NFT**
   - After successful verification
   - Click "Evolve Soul NFT"
   - Confirm transaction
   - View evolved artwork in gallery

## Production Checklist

### Security

- [ ] All API keys stored in environment variables
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled and tested
- [ ] Input validation on all endpoints
- [ ] HTTPS/SSL configured
- [ ] Content Security Policy headers set

### Performance

- [ ] Backend: Gunicorn with multiple workers
- [ ] Frontend: Production build optimized
- [ ] Static assets cached
- [ ] IPFS pinning service configured
- [ ] Database indexes (if applicable)

### Monitoring

- [ ] Error tracking (Sentry, LogRocket)
- [ ] API monitoring (uptime checks)
- [ ] Analytics configured
- [ ] Log aggregation setup

### Testing

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] E2E tests on testnet successful
- [ ] Load testing completed
- [ ] Security audit performed

### Documentation

- [ ] API documentation updated
- [ ] User guide written
- [ ] Admin documentation created
- [ ] Changelog maintained

## Rollback Plan

If deployment fails:

1. **Backend**: Revert to previous Docker image or code version
2. **Frontend**: Rollback in Vercel/Netlify dashboard
3. **Contract**: Use previous contract address (contracts are immutable)

## Monitoring Production

### Backend Health

```bash
# Check API health
curl https://your-api.com/health

# Check metrics
curl https://your-api.com/metrics  # If implemented
```

### Frontend Monitoring

- Check error logs in Vercel/Netlify
- Monitor API call success rates
- Track wallet connection success
- Monitor transaction confirmation times

### IPFS Status

```bash
# Check IPFS node
ipfs swarm peers  # Should show connected peers

# Test pinning
ipfs pin ls | grep QmYourHash
```

## Support and Troubleshooting

### Common Issues

**Issue**: Backend not connecting to IPFS
**Solution**: Check IPFS daemon is running, verify API URL in .env

**Issue**: Contract transactions failing
**Solution**: Ensure wallet has testnet XTZ, check contract address is correct

**Issue**: Frontend build errors
**Solution**: Clear .next directory, reinstall node_modules

**Issue**: Rate limiting blocking legitimate users
**Solution**: Adjust limits in `backend/middleware/ratelimit.py`

### Getting Help

- GitHub Issues: [Your repo URL]
- Documentation: [Your docs URL]
- Community: [Discord/Telegram]

## Next Steps

After successful deployment:

1. Test all user flows on testnet
2. Gather user feedback
3. Monitor error rates and performance
4. Plan mainnet deployment
5. Prepare marketing materials

---

**Last Updated**: Week 6 - Hardening & Demo Complete
**Version**: 0.5.0
