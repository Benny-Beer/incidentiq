import logging
import time

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError

from .ai_service import analyze_incident
from .schemas import IncidentAnalysis

load_dotenv()

logging.basicConfig(
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
    level=logging.INFO,
)
logger = logging.getLogger("incidentiq")

app = FastAPI(title="IncidentIQ API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    logger.info("→ %s %s", request.method, request.url.path)
    response = await call_next(request)
    ms = (time.perf_counter() - start) * 1000
    logger.info("← %s %s  %d  %.0fms", request.method, request.url.path, response.status_code, ms)
    return response


# ── Request / response models ─────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    incident_text: str


class ReportResponse(BaseModel):
    report: str


# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze", response_model=IncidentAnalysis, tags=["AI"])
def analyze(body: AnalyzeRequest) -> IncidentAnalysis:
    """
    Analyze raw incident text with Claude and return a structured IncidentAnalysis.

    The model is forced to separate facts from assumptions, generate ≥3 hypotheses
    with evidence for/against each, cite sources on every timeline event, and flag
    cognitive biases in the reasoning.
    """
    try:
        return analyze_incident(body.incident_text)
    except (ValueError, ValidationError) as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception:
        logger.exception("analyze_incident failed")
        raise HTTPException(status_code=500, detail="Analysis failed — check server logs.")


@app.post("/api/report", response_model=ReportResponse, tags=["Reports"])
def report(analysis: IncidentAnalysis) -> ReportResponse:
    """
    Convert a structured IncidentAnalysis into a formatted Markdown postmortem report.

    Accepts the exact JSON returned by POST /api/analyze.
    """
    return ReportResponse(report=_render_markdown(analysis))


# ── Markdown renderer ─────────────────────────────────────────────────────────

def _pipe(text: str) -> str:
    """Escape pipe characters so they don't break Markdown tables."""
    return text.replace("|", "\\|")


def _render_markdown(a: IncidentAnalysis) -> str:
    parts: list[str] = []

    def h(level: int, title: str) -> None:
        parts.append(f"\n{'#' * level} {title}\n")

    def hr() -> None:
        parts.append("\n---\n")

    # ── Header ────────────────────────────────────────────────────────────────
    parts.append("# Incident Postmortem\n")

    # ── Summary ───────────────────────────────────────────────────────────────
    h(2, "Incident Summary")
    parts.append(a.summary + "\n")
    hr()

    # ── Timeline ──────────────────────────────────────────────────────────────
    h(2, "Timeline")
    parts.append("| Timestamp | Event | Source |")
    parts.append("|-----------|-------|--------|")
    for e in a.timeline:
        parts.append(f"| {_pipe(e.timestamp)} | {_pipe(e.event)} | {_pipe(e.evidence_source)} |")
    hr()

    # ── Hypotheses ────────────────────────────────────────────────────────────
    h(2, "Root-Cause Hypotheses")
    parts.append("*Ranked by confidence. All remain candidates until the recommended test is run.*\n")
    for i, hyp in enumerate(sorted(a.hypotheses, key=lambda h: h.confidence, reverse=True), 1):
        pct = int(hyp.confidence * 100)
        parts.append(f"### {i}. {hyp.title} — {pct}% confidence\n")
        parts.append("**Evidence For:**")
        parts.extend(f"- {item}" for item in hyp.evidence_for)
        parts.append("\n**Evidence Against:**")
        parts.extend(f"- {item}" for item in hyp.evidence_against)
        parts.append(f"\n**Recommended Test:** {hyp.recommended_test}\n")
    hr()

    # ── Evidence Analysis ─────────────────────────────────────────────────────
    h(2, "Evidence Analysis")
    h(3, "Confirmed Facts")
    parts.extend(f"- {f}" for f in a.facts)
    parts.append("")
    h(3, "Unverified Assumptions")
    parts.extend(f"- ⚠️ {asmp}" for asmp in a.assumptions)
    hr()

    # ── Reasoning Risks ───────────────────────────────────────────────────────
    h(2, "Reasoning Risks & Cognitive Biases")
    for risk in a.reasoning_risks:
        parts.append(f"### {risk.bias_or_fallacy}\n")
        parts.append(f"**Where it appears:** {risk.where_it_appears}  ")
        parts.append(f"**Mitigation:** {risk.mitigation}\n")
    hr()

    # ── Next Actions ──────────────────────────────────────────────────────────
    h(2, "Next Actions")
    parts.append("| # | Action | Linked Evidence |")
    parts.append("|---|--------|----------------|")
    for i, action in enumerate(a.next_actions, 1):
        parts.append(f"| {i} | {_pipe(action.action)} | {_pipe(action.linked_evidence)} |")
    hr()

    # ── Open Questions ────────────────────────────────────────────────────────
    h(2, "Open Questions")
    parts.extend(f"- ❓ {q}" for q in a.open_questions)
    parts.append("")

    return "\n".join(parts)
