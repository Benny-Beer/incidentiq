# IncidentIQ

AI-powered incident management tool built with FastAPI + React.

## Prerequisites

- Python 3.11+
- Node.js 18+
- An Anthropic API key

## Setup

### 1. Clone & configure environment

```bash
git clone <repo-url>
cd incidentiq
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 2. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r ../requirements.txt
```

### 3. Frontend

```bash
cd frontend
npm install
```

## Running locally

Open two terminals from the project root:

**Terminal 1 — API server**
```bash
cd backend
.venv\Scripts\activate   # or: source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 — Dev server**
```bash
cd frontend
npm run dev
```

- Backend: http://localhost:8000
- Frontend: http://localhost:5173
- API docs: http://localhost:8000/docs

## Project structure

```
incidentiq/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI app & middleware
│       ├── routers/         # Route handlers
│       └── models/          # Pydantic models
├── frontend/
│   └── src/
│       ├── main.jsx
│       └── App.jsx
├── sample_data/             # Example incident datasets
├── docs/                    # Additional documentation
├── requirements.txt
└── .env.example
```
