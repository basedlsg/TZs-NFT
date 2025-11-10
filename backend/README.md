# Proof of Becoming Backend API

FastAPI backend for AI verification, quantum seed generation, and metadata management.

---

## Overview

The backend provides REST API endpoints for:
- **Week 2 (Current):** Health checks, basic infrastructure
- **Week 3:** IPFS metadata generation and pinning
- **Week 4:** AI proof verification (vision + heuristics)
- **Week 5:** Quantum random seed generation for NFT art

---

## Quick Start

### 1. Prerequisites

- Python 3.10+
- pip or conda

### 2. Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your settings (optional for now)
# nano .env
```

### 4. Run Server

```bash
# Development server with hot reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### 5. Test API

Open your browser:
- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

Or use curl:
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "pob-backend",
  "version": "0.1.0"
}
```

---

## API Endpoints

### Current (Week 2)

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "pob-backend",
  "version": "0.1.0"
}
```

**Status Codes:**
- `200`: Service is healthy

---

### Future Endpoints (Week 3-5)

#### `POST /api/verify-proof` (Week 4)
Verify proof of ritual completion using AI.

**Request:**
```json
{
  "goal_id": "run_5km",
  "image_base64": "...",
  "reflection": "I ran 5km today..."
}
```

**Response:**
```json
{
  "verified": true,
  "confidence": 0.92,
  "reasoning": "Image shows outdoor running activity..."
}
```

---

#### `GET /api/quantum-seed` (Week 5)
Generate quantum random seed for NFT evolution.

**Response:**
```json
{
  "seed": "4a7f3b2c1d9e8f0a...",
  "source": "anu-qrng",
  "timestamp": 1699999999
}
```

---

#### `POST /api/generate-metadata` (Week 3)
Generate NFT metadata with art URI.

**Request:**
```json
{
  "token_id": 0,
  "stage": 1,
  "seed": "quantum-seed-abc"
}
```

**Response:**
```json
{
  "metadata_uri": "ipfs://QmNewMetadata...",
  "metadata": {
    "name": "Soul NFT #0 - Stage 1",
    "image": "ipfs://QmGeneratedArt...",
    "attributes": [...]
  }
}
```

---

## Testing

### Run Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test
pytest test_main.py::test_health_endpoint_returns_200
```

### Expected Output

```
============================= test session starts ==============================
collected 7 items

test_main.py .......                                                     [100%]

============================== 7 passed in 0.15s ===============================
```

### Manual Testing

```bash
# Health check
curl http://localhost:8000/health

# API documentation (interactive)
open http://localhost:8000/docs
```

---

## Project Structure

```
backend/
├── main.py              # FastAPI application
├── test_main.py         # pytest tests
├── requirements.txt     # Python dependencies
├── .env.example         # Environment template
├── .env                 # Local config (gitignored)
├── README.md            # This file
└── api/                 # Future: API routes (Week 3+)
    ├── __init__.py
    ├── verify.py        # Verification endpoints
    ├── quantum.py       # QRNG endpoints
    └── metadata.py      # Metadata generation
```

---

## Development

### Adding New Endpoints

1. **Write tests first** in `test_main.py`:
   ```python
   def test_new_endpoint():
       client = TestClient(app)
       response = client.get("/api/new-endpoint")
       assert response.status_code == 200
   ```

2. **Implement endpoint** in `main.py`:
   ```python
   @app.get("/api/new-endpoint")
   async def new_endpoint():
       return {"message": "Hello"}
   ```

3. **Run tests**:
   ```bash
   pytest -v
   ```

### Code Quality

```bash
# Format code
pip install black
black .

# Lint
pip install flake8
flake8 main.py

# Type checking
pip install mypy
mypy main.py
```

---

## Environment Variables

### Development (Week 2)

```bash
# .env
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=http://localhost:3000
```

### Production (Future)

```bash
# .env
ENVIRONMENT=production
HOST=0.0.0.0
PORT=8000
FRONTEND_URL=https://your-frontend.com

# AI Verification (Week 4)
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4-vision-preview

# QRNG (Week 5)
QRNG_API_KEY=...
QRNG_PROVIDER=anu

# IPFS (Week 3)
IPFS_API_URL=/ip4/127.0.0.1/tcp/5001
```

---

## Deployment

### Docker (Optional)

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Build and run:**
```bash
docker build -t pob-backend .
docker run -p 8000:8000 pob-backend
```

### Production Servers

#### Option 1: Uvicorn (Simple)
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

#### Option 2: Gunicorn + Uvicorn (Recommended)
```bash
pip install gunicorn
gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## CORS Configuration

The API allows requests from:
- `http://localhost:3000` (Next.js dev)
- `http://127.0.0.1:3000`
- Custom frontend URL from `FRONTEND_URL` env var

To add more origins, edit `main.py`:
```python
origins = [
    "http://localhost:3000",
    "https://your-production-domain.com",
]
```

---

## Security Considerations

### Current (Week 2)

✅ CORS configured for known origins only
✅ No sensitive data in health endpoint
✅ `.env` gitignored (never commit secrets)

### Future (Week 3+)

- [ ] **Rate limiting** on verification endpoints (prevent abuse)
- [ ] **API key authentication** for sensitive operations
- [ ] **Input validation** for image uploads (file type, size)
- [ ] **Content moderation** on user-uploaded images
- [ ] **HTTPS only** in production
- [ ] **Secret management** (use env vars, not hardcoded)

---

## Troubleshooting

### Port 8000 already in use
```bash
# Find process using port
lsof -i :8000
# Kill process
kill -9 <PID>
# Or use different port
uvicorn main:app --port 8001
```

### Module not found
```bash
# Ensure venv is activated
source venv/bin/activate
# Reinstall dependencies
pip install -r requirements.txt
```

### CORS errors
```bash
# Check FRONTEND_URL in .env matches your frontend
# Default: http://localhost:3000
```

### Tests fail
```bash
# Ensure all dependencies installed
pip install -r requirements.txt
# Run pytest with verbose output
pytest -v
```

---

## Roadmap

### Week 2 (Current) ✅
- [x] FastAPI setup
- [x] Health endpoint
- [x] CORS configuration
- [x] Basic tests
- [x] Documentation

### Week 3
- [ ] IPFS integration
- [ ] Metadata generation endpoint
- [ ] Image upload handling

### Week 4
- [ ] AI verification endpoint
- [ ] Vision model integration (OpenAI GPT-4 Vision)
- [ ] Heuristics + fallback flow
- [ ] Rate limiting

### Week 5
- [ ] Quantum seed generation
- [ ] Generative art creation
- [ ] IPFS pinning for art

### Week 6
- [ ] Error handling improvements
- [ ] Logging and monitoring
- [ ] Performance optimization
- [ ] Production deployment

---

## References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Uvicorn Server](https://www.uvicorn.org/)
- [pytest Documentation](https://docs.pytest.org/)
- [Pydantic Models](https://docs.pydantic.dev/)

---

## License

MIT
