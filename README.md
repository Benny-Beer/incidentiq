# IncidentIQ

An AI-powered incident response and root-cause analysis tool. Paste raw incident logs, error messages, or deployment notes and get back a structured investigation — facts vs assumptions, ranked hypotheses with evidence for and against each, cognitive bias warnings, and a draft postmortem report.

Built with FastAPI, React, and the Claude API.

---

## Demo Video
[![IncidentIQ Demo](https://img.youtube.com/vi/xUIwD_BlZKI/0.jpg)](https://www.youtube.com/watch?v=xUIwD_BlZKI)

## What it does

You paste messy incident data (logs, alerts, deployment notes, error traces) into the text box and click **Analyze**. The tool returns:

- **Incident summary** — neutral description of what happened
- **Facts vs Assumptions** — separated clearly so you know what's proven and what's guessed
- **Timeline** — events reconstructed in order with evidence sources
- **Hypotheses** — ranked by confidence, each with evidence for, evidence against, and a recommended test
- **Reasoning risks** — cognitive biases flagged in the investigation
- **Next actions** — specific debugging steps linked to evidence
- **Open questions** — what still needs to be investigated
- **Postmortem report** — exportable Markdown document

---

## Requirements

Before you start, make sure you have these installed:

- **Python 3.10+** — download from [python.org](https://www.python.org/downloads/)
- **Node.js 18+** — download from [nodejs.org](https://nodejs.org/) (choose the LTS version)
- **Git** — download from [git-scm.com](https://git-scm.com/)
- **An Anthropic API key** — see instructions below

---

## How to get a Claude API key

1. Go to [console.anthropic.com](https://console.anthropic.com) and sign in or create an account
2. Click **API Keys** in the left sidebar
3. Click **Create Key**, give it a name (e.g. `incidentiq`)
4. **Copy the key immediately** — it starts with `sk-ant-...` and Anthropic only shows it once
5. Go to **Billing** and add a small amount of credit ($5 is more than enough for this project)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/incidentiq.git
cd incidentiq
```

### 2. Set your API key

**Windows (PowerShell) — recommended:**
```powershell
[System.Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-your-key-here", "User")
```
Then close and reopen your terminal so the change takes effect.

**Mac/Linux:**
```bash
echo 'export ANTHROPIC_API_KEY="sk-ant-your-key-here"' >> ~/.zshrc
source ~/.zshrc
```

**Or using a .env file (all platforms):**
```bash
cp .env.example .env
# Open .env in any text editor and paste your key after ANTHROPIC_API_KEY=
```

### 3. Set up the backend

```bash
cd backend
python -m venv .venv
```

**Windows:**
```powershell
.venv\Scripts\activate
```

**Mac/Linux:**
```bash
source .venv/bin/activate
```

Then install dependencies:
```bash
pip install -r ../requirements.txt
```

### 4. Set up the frontend

```bash
cd ../frontend
npm install
```

---

## Running the app

You need **two terminals** running at the same time.

### Terminal 1 — Backend

**Windows:**
```powershell
cd "C:\path\to\incidentiq"
cd backend
.venv\Scripts\activate
cd ..
uvicorn backend.app.main:app --reload --port 8000
```

**Mac/Linux:**
```bash
cd /path/to/incidentiq
source backend/.venv/bin/activate
uvicorn backend.app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Terminal 2 — Frontend

```bash
cd /path/to/incidentiq/frontend
npm run dev
```

You should see:
```
  VITE ready in 300ms
  ➜  Local:   http://localhost:5173/
```

### Open the app

Go to **http://localhost:5173** in your browser.

To verify the backend is running separately, visit **http://localhost:8000/docs** — you should see the API documentation.

---

## Using the app

1. Open http://localhost:5173
2. Paste incident data into the text box — logs, error messages, deployment notes, anything
3. Click **Analyze Incident** (or press Ctrl+Enter)
4. Wait 15–30 seconds while Claude analyzes the data
5. Review the results across all sections
6. Click **Generate Postmortem Report** to get an exportable Markdown document

### Example input

```
At 14:23 UTC, checkout error rate spiked to 23% after deploying v2.3.1.
DB connection pool hit max (100 connections). Rollback to v2.3.0 at 14:42
resolved the issue. Payment and inventory services unaffected.
New feature in v2.3.1: async order confirmation emails.
Similar connection exhaustion incident occurred 3 months ago after v2.1.0 deploy.
```

Sample incident files are available in the `sample_data/` folder.

---

## Project structure

```
incidentiq/
├── backend/
│   └── app/
│       ├── main.py         # FastAPI app, endpoints, Markdown renderer
│       ├── ai_service.py   # Claude API calls and JSON parsing
│       ├── prompts.py      # System prompt sent to Claude
│       └── schemas.py      # Pydantic data models
├── frontend/
│   └── src/
│       ├── App.jsx                    # Main app
│       └── components/
│           ├── IncidentInput.jsx      # Text input and analyze button
│           ├── AnalysisResults.jsx    # Results cards
│           └── ReportPanel.jsx        # Postmortem report view
├── sample_data/            # Example incident files
├── docs/
│   └── prompts_used.md     # All prompts the system sends to Claude
├── .env.example            # Template for environment variables
├── requirements.txt        # Python dependencies
└── README.md
```

---

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check the server is running |
| POST | `/api/analyze` | Analyze incident text, returns structured JSON |
| POST | `/api/report` | Convert analysis to Markdown postmortem |

Full API documentation available at http://localhost:8000/docs when the server is running.

---

## AI tools used

- **Claude claude-sonnet-4-6** (Anthropic) — incident analysis, hypothesis generation, bias detection
- **Anthropic Python SDK** — API client with prompt caching enabled

---

## Troubleshooting

**"Analysis failed — check server logs"**
Your API key is not being found. Make sure you set `ANTHROPIC_API_KEY` and restarted the terminal before running the backend.

**"vite is not recognized"**
Run `npm install` inside the `frontend/` folder first.

**"&& is not a valid statement separator"**
You are on Windows PowerShell. Run each command on a separate line instead of joining them with `&&`.

**Backend starts but frontend shows a blank page**
Make sure both terminals are running — the backend on port 8000 and the frontend on port 5173.