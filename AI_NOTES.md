# AI Notes — IncidentIQ Development Log

This file documents observations made during the development of IncidentIQ,
including AI mistakes, surprising outputs, prompt iterations, and cognitive
biases noticed in both the tool and the developer. This material forms the
basis of the reflective report.

---

## Phase 1 — Building the AI Core

### Observation 1: The system prompt was far more detailed than expected

Claude Code wrote a 99-line system prompt with 5 explicit epistemic rules,
including a self-validation checklist at the very end that tells the model
to verify its own output before returning it.

**What this means:** Claude Code didn't just write a basic instruction like
"analyze this incident." It built a structured reasoning framework that forces
the model to separate facts from assumptions, generate competing hypotheses,
and actively look for its own biases.

**Interesting question this raised:** Will this level of constraint make the
AI too rigid, or will it produce better output? This was answered in Phase 1
testing — the constraints produced more calibrated, nuanced output than a
simple prompt would have.

**Prompt iteration noted:** The system prompt went through implicit iteration
as Claude Code refined the rules. The final version includes explicit
instructions like "never state a single definitive root cause" and "evidence
against must not be left empty" — these were not in the initial brief, but
Claude Code added them as guardrails.

---

### Observation 2: The retry mechanism assumes AI will fail

In `ai_service.py`, Claude Code built a retry system: if the model returns
invalid JSON, the error message is sent back to the model so it can correct
itself. There is one retry attempt.

**What this reveals about AI reliability:** The system is designed around
the assumption that the AI will sometimes fail to follow instructions — even
very explicit ones. This is an honest acknowledgment of AI limitations built
directly into the architecture.

**Critical question raised:** Is one retry enough? What if the model fails
twice in a row? This is an example of mild overconfidence in AI reliability —
the system assumes one correction attempt is sufficient, but there is no
fallback beyond that. In production, this could cause silent failures.

**Prompt caching:** Claude Code automatically added prompt caching
(`cache_control: ephemeral`) to the system prompt block. This was added
without being asked, reducing API costs by avoiding re-sending the 99-line
prompt on every request. This is a good example of AI tooling adding value
beyond the explicit request.

---

### Observation 3: Claude Code caught its own import error without being asked

Claude Code wrote an import path (`from backend.app.ai_service import
analyze_incident`), then immediately corrected it to (`from app.ai_service
import analyze_incident`) without being prompted.

**Original:**
```python
from backend.app.ai_service import analyze_incident
```

**Corrected:**
```python
from app.ai_service import analyze_incident
```

It also changed `sys.path` to point to `backend/` instead of the repo root.

**Observation:** The AI caught its own mistake — but only because it was
still actively working on the same file. The key question is: would it have
caught this error if it only appeared at runtime, after Claude Code had moved
on to a different file? Probably not. This highlights that AI self-correction
is context-dependent, not systematic.

---

## Phase 1 — First Real AI Output (Checkout Failure Scenario)

The test script ran the checkout failure scenario (v2.3.1, database connection
pool exhaustion) through the full AI pipeline. Here is what was observed.

### What worked well

- **16 facts extracted**, all directly traceable to the input — no
  hallucinations detected in the facts section
- **Confidence scores felt calibrated** — 62%, 45%, 22%, 18% — not
  suspiciously round numbers, suggesting genuine differentiation between
  hypotheses
- **Hypothesis 3 (external factor, 18%)** actively argued against the obvious
  answer — this is exactly the critical thinking the brief requires. The AI
  did not just generate three variations of the same theory.
- **Blame attribution bias** (Reasoning Risk 5) was sophisticated — the AI
  flagged systemic and process issues (why was the connection pool sized at
  100? why did code review miss this?) rather than just blaming a specific
  code change. This shows the prompt's bias-detection rules working as intended.

### What was problematic

**Problem 1 — Summary described the fix, not the cause:**
The summary stated the incident was "resolved by rolling back checkout-service
from v2.3.1 to v2.3.0." This frames the rollback as the headline rather than
the underlying cause. A human engineer writing a postmortem would lead with
what went wrong, not how it was fixed. This is a subtle framing bias in the
AI output.

**Problem 2 — AI invented an assumption not supported by the input:**
Assumption 5 stated: *"The async email feature introduced in v2.3.1 interacts
with the database in some capacity, even though release notes do not explicitly
state this."*

This assumption had no basis in the input text. The release notes explicitly
said there were no database changes. The AI filled a gap in the evidence with
a plausible-sounding inference and presented it as an assumption rather than
flagging it as speculation. This is hallucination-adjacent behavior — not a
fabricated fact, but an invented logical step that shapes the entire analysis.

**Problem 3 — The AI flagged a bias it was simultaneously committing:**
The AI correctly identified "Temporal Proximity Bias" as a reasoning risk —
the tendency to assume the deployment caused the incident because it happened
shortly before. However, all 4 hypotheses still pointed to v2.3.1 as the
cause. The AI identified its own potential bias in the reasoning risks section
but did not correct for it in the hypotheses section.

This is a significant finding: **the AI can describe a cognitive bias
accurately while simultaneously exhibiting that same bias.** Flagging a
bias and correcting for it are two different things.

---

### Bias noticed in myself (developer)

I found the output convincing because it sounded professional, detailed, and
well-structured. I did not question whether Assumption 5 was supported by the
input until I read through it carefully a second time. This is **automation
bias** — the tendency to over-trust AI output because it appears authoritative.

The structured format (numbered hypotheses, percentage confidence scores,
green/red evidence cards) made the output feel more reliable than it actually
was. Presentation quality is not the same as analytical quality.

---

## Phase 3 — First Full UI Test

### Input
Three lines of raw incident text about a checkout service failure.

### Output
- 8 facts
- 6 assumptions
- 5 timeline events
- 4 hypotheses
- 5 reasoning risks
- 6 next actions
- 6 open questions

### What worked well
- The tool never claimed a definitive root cause ✓
- Hypothesis 4 (external factor, 15%) actively argued against the obvious
  answer ✓
- The confidence bar visualization made it immediately clear that Hypothesis
  1 was leading but not dominant

### What was problematic

**Assumption 4 — AI invented traffic data:**
The tool generated the assumption: *"Traffic volume during the incident was
within normal range."* No traffic data was provided in the input. The AI
invented this assumption and presented it as a reasonable belief, when in
reality it had no basis to make any claim about traffic volume.

This is not a hallucination in the traditional sense — the AI correctly
labelled it as an assumption rather than a fact. But the assumption shapes
the analysis: if the AI assumes traffic was normal, it reduces the weight
given to external-factor hypotheses. An invented assumption that influences
the conclusions is a meaningful AI limitation.

**The temporal proximity bias pattern repeated:**
As in Phase 1 testing, the AI flagged temporal proximity bias as a reasoning
risk but still led with the deployment as the most likely cause. This pattern
appeared consistently across multiple test runs, suggesting it is a
structural tendency in how the model reasons about incidents, not a one-off.

---

## Summary of Key AI Limitations Observed

| Observation | Type | Impact |
|---|---|---|
| AI invented Assumption 5 (async email touches DB) | Gap-filling / hallucination-adjacent | Shaped hypothesis ranking |
| AI invented Assumption 4 (traffic was normal) | Gap-filling | Reduced weight on external-factor hypothesis |
| Summary described fix not cause | Framing bias | Misleading headline |
| AI flagged temporal proximity bias but still committed it | Bias awareness ≠ bias correction | All hypotheses still implicated deployment |
| One retry assumes AI fails at most once | Overconfidence in reliability | Potential silent failures |
| Structured output felt more reliable than it was | Automation bias (in developer) | Reduced critical scrutiny |

---

## Prompt Iterations

### System prompt — v1 (implicit, before constraints)
A basic instruction would have produced something like: "Analyze this incident
and tell me what caused it."

**Problem:** The AI would produce a single root cause conclusion with high
confidence, no competing hypotheses, and no bias awareness.

### System prompt — v2 (final, with 5 epistemic rules)
Added: separation of facts/assumptions/hypotheses, prohibition on single root
cause, minimum 3 hypotheses with evidence against required, evidence source
citation on timeline, minimum 3 reasoning risks, self-validation checklist.

**Result:** Output was more calibrated, more honest about uncertainty, and
more useful for a real investigation. The constraints worked. However, the
AI still exhibited temporal proximity bias despite being explicitly told to
flag it — showing that instructions can shape output without fully eliminating
underlying model tendencies.