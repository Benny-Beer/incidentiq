# Prompts Used in IncidentIQ

This document records every prompt the IncidentIQ system sends to the Claude
API, the reasoning behind each design decision, and how the prompts evolved
during development.

---

## Overview

IncidentIQ uses two prompts:

1. **System prompt** — sent with every analysis request, defines the AI's
   role, rules, and required output format
2. **Retry prompt** — sent only when the first response fails JSON validation,
   asks the model to correct itself

All prompts are stored in `backend/app/prompts.py`.

---

## 1. System Prompt

### Location
`backend/app/prompts.py` → `SYSTEM_PROMPT`

### How it is used
The system prompt is sent as the `system` parameter on every call to
`POST /api/analyze`. It is cached using Anthropic's prompt caching
(`cache_control: ephemeral`) so it is not re-processed on every request,
reducing latency and API cost.

### Full prompt text

```
You are an expert incident analyst specializing in rigorous, bias-aware root
cause analysis. You apply the scientific method to incidents: you generate
competing hypotheses, seek disconfirming evidence, and never prematurely
converge on a single explanation.

## CORE EPISTEMIC RULES

### Rule 1 — Strict separation of facts, assumptions, and hypotheses

FACTS: Only include directly observable, documented, verifiable data points.
A fact must come from a concrete source (log entry, metric reading, alert,
direct observation). If it requires inference, it is NOT a fact.

ASSUMPTIONS: Include beliefs that are reasonable and probably true but have
not been directly verified. Label them honestly.

HYPOTHESES: These are candidate causal explanations. They are NOT conclusions.
A hypothesis that fits the facts is still just a hypothesis until tested.

### Rule 2 — Never assert a single definitive root cause

Do NOT write conclusions like "The root cause was X." Incidents often have
multiple contributing factors. Use language like "Hypothesis A is the most
supported by current evidence" while maintaining that other explanations
remain possible. Preserve uncertainty.

### Rule 3 — Minimum 3 hypotheses, each with evidence for AND against

You MUST produce at least 3 distinct, non-trivial hypotheses. Each hypothesis
MUST have:
- evidence_for: specific evidence from the incident that supports this hypothesis
- evidence_against: specific evidence or logical arguments that work against it
  (do NOT leave this empty — if evidence against is weak, note why it is weak
  but still provide at least one entry)
- recommended_test: a concrete, actionable test or investigation step that
  would help confirm or rule out this hypothesis

Confidence scores (0.0 to 1.0) reflect relative plausibility given current
evidence, not certainty.

### Rule 4 — Cite evidence sources on every timeline event

Every entry in the timeline array MUST include a non-empty evidence_source
field identifying where this information came from. Do NOT create timeline
events without a source.

### Rule 5 — Identify cognitive biases actively

Search your own analysis for cognitive biases and logical fallacies. You MUST
flag at least 3 reasoning risks. Common ones in incident analysis:

- Temporal proximity bias: assuming causation from correlation in time
- Confirmation bias: seeking evidence that confirms the first hypothesis
- Hindsight bias: knowing the outcome makes earlier causes seem obvious
- Automation bias: over-trusting automated alerts or dashboards
- Alert fatigue bias: discounting signals that frequently fire falsely
- Blame attribution bias: attributing incidents to human error rather than
  systemic factors
- Availability heuristic: overweighting the most recent or memorable explanation

For each bias: state WHERE in the analysis it appears and HOW to mitigate it.

## OUTPUT REQUIREMENTS

Return ONLY a single valid JSON object. No markdown formatting, no code fences,
no text before or after the JSON. The JSON must conform exactly to this structure:

{
  "summary": "...",
  "facts": ["..."],
  "assumptions": ["..."],
  "timeline": [
    {
      "timestamp": "...",
      "event": "...",
      "evidence_source": "..."
    }
  ],
  "hypotheses": [
    {
      "title": "...",
      "confidence": 0.0,
      "evidence_for": ["..."],
      "evidence_against": ["..."],
      "recommended_test": "..."
    }
  ],
  "reasoning_risks": [
    {
      "bias_or_fallacy": "...",
      "where_it_appears": "...",
      "mitigation": "..."
    }
  ],
  "next_actions": [
    {
      "action": "...",
      "linked_evidence": "..."
    }
  ],
  "open_questions": ["..."]
}

VALIDATION CHECKLIST before returning:
- hypotheses array has at least 3 entries
- every timeline entry has a non-empty evidence_source
- every hypothesis has at least one entry in evidence_for AND evidence_against
- reasoning_risks has at least 3 entries
- the output is valid JSON with no trailing text
```

### Why the prompt was designed this way

**Rule 1 (Facts vs Assumptions):** Without this rule, the AI mixes proven
observations with inferences. Separating them forces the analysis to be
honest about what is actually known versus what is being assumed. In testing,
without this rule the AI regularly treated assumptions as facts.

**Rule 2 (No definitive root cause):** A naive prompt produces outputs like
"The root cause was the deployment." This is overconfident — in real incidents
the cause is rarely certain without further investigation. This rule forces
the AI to preserve uncertainty and present conclusions as hypotheses.

**Rule 3 (Minimum 3 hypotheses with evidence against):** The most important
rule. Without it, the AI generates one strong hypothesis and two weak ones as
filler. Requiring evidence *against* every hypothesis is what prevents the
AI from building a one-sided case. In testing, removing this rule caused the
AI to leave evidence_against fields empty or filled with weak disclaimers.

**Rule 4 (Cite sources on timeline):** Without source citations, the timeline
mixes facts from logs with inferences from context. Requiring a source for
every event makes it clear what is documented versus reconstructed.

**Rule 5 (Flag cognitive biases):** This is the most distinctive feature of
the prompt. The AI is asked to find biases in its *own* reasoning, not just
in the incident investigation. In testing, this produced sophisticated
observations — for example, flagging that temporal proximity bias might be
affecting the analysis while still generating hypotheses that assumed the
deployment was the cause. This limitation (flagging a bias without correcting
for it) is itself an important finding about AI reasoning.

**Validation checklist at the end:** Adding a checklist the model must verify
before responding reduced invalid JSON responses significantly. The model
appears to re-check its output when explicitly asked to.

---

## 2. Retry Prompt

### Location
`backend/app/ai_service.py` → `analyze_incident()` function

### When it is used
If the model's first response cannot be parsed as valid JSON or fails Pydantic
schema validation, the retry prompt is constructed and sent as a second
request. There is one retry attempt.

### Prompt structure

```
{original incident text}

---
NOTE: Your previous response could not be parsed.
Error: {error message from json.JSONDecodeError or ValidationError}

Return ONLY a valid JSON object matching the required schema.
No markdown, no code fences, no text outside the JSON.
```

### Why it is designed this way

Sending the actual error message back to the model (rather than just asking
it to try again) gives it specific information about what went wrong. In
testing, this approach resolved JSON formatting issues on the retry in all
cases where the retry was triggered.

**Known limitation:** The system assumes one retry is sufficient. If the
model fails twice, the error propagates to the frontend as a 500 response.
This is a known limitation — in a production system, a fallback response or
a third attempt with a simpler prompt would be appropriate.

---

## Prompt Iterations

### Version 1 — What a naive prompt would look like

```
Analyze this incident and tell me what caused it. Return your answer as JSON.

{incident text}
```

**Problems with this approach:**
- AI produces a single definitive root cause ("The root cause was X")
- Facts and assumptions are mixed together without distinction
- Only one or two hypotheses generated, both supporting the same theory
- No bias awareness
- JSON format is inconsistent and often invalid
- Evidence is not cited to specific sources

### Version 2 — Adding structure without constraints

```
Analyze this incident. Return JSON with: summary, facts, assumptions,
hypotheses, next_actions.
```

**Problems:**
- AI still collapses to one dominant hypothesis
- evidence_against fields left empty
- No bias detection
- Timeline events not sourced

### Version 3 — Final version (as above)

Added 5 epistemic rules, required evidence_against for every hypothesis,
required source citation on every timeline event, required minimum 3 reasoning
risks, added JSON-only output requirement, added self-validation checklist.

**Result:** Consistently produces calibrated, multi-hypothesis output with
honest uncertainty. The key improvement was requiring evidence *against* —
this single constraint had the largest impact on output quality.

---

## Observations About Prompt Effectiveness

During development and testing, the following was observed:

**What the prompt successfully enforced:**
- Facts and assumptions separated correctly in all test runs
- Minimum 3 hypotheses always produced
- Evidence against always populated (never empty)
- Timeline sources always cited
- At least 3 reasoning risks always flagged
- No definitive root cause stated in any test run

**What the prompt did NOT fully correct:**
- Temporal proximity bias: the AI flagged this bias in reasoning risks but
  still ranked the most recent deployment as the top hypothesis in all test
  runs. The prompt made the AI *aware* of the bias but did not eliminate it.
- Gap-filling assumptions: the AI occasionally invented plausible assumptions
  not supported by the input (e.g., assuming an async email feature interacts
  with the database when the input said no database changes were made). These
  were correctly labelled as assumptions, but their plausibility made them
  easy to miss on casual review.
- Summary framing: the AI occasionally described the resolution rather than
  the incident in the summary field ("resolved by rolling back" rather than
  "caused by X").

These limitations are documented in `AI_NOTES.md` and discussed in the
reflective report.