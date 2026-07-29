### Phase 1 — AI core build
- What Claude Code did:
- Something it got wrong or had to redo:
- Something that surprised me:
- Bias I noticed (in me or the tool):

### Phase 1 — prompts.py
- Claude Code wrote a system prompt with 5 explicit epistemic rules
- It included a self-validation checklist at the end of the prompt
  (interesting technique — making the AI verify its own output before returning)
- Prompt is ~99 lines, much more detailed than I expected
- Question: will this level of constraint make the AI too rigid or produce better output?
  (test this when sample data runs)

  ### Phase 1 — ai_service.py
- The AI sometimes returns invalid JSON even when told not to
- Claude Code built a retry that sends the error message back to the 
  model so it can correct itself
- This means the system assumes AI will fail sometimes — it's designed
  around that assumption
- Bias note: is one retry enough? What if it fails twice?
  (example of overconfidence in AI reliability)
- Prompt caching added automatically — system prompt cached to save API costs

### Phase 1 — self-correction
- Claude Code wrote an import path, then immediately corrected it
  without being asked
- Original: `from backend.app.ai_service import analyze_incident`
- Fixed to: `from app.ai_service import analyze_incident`
- It also changed sys.path to point to backend/ instead of repo root
- Observation: AI caught its own mistake — but only because it was
  still "thinking" about the same file. Would it have caught it if
  the error only appeared at runtime?


  ### Phase 1 — First real AI output (checkout failure scenario)

GOOD:
- 16 facts extracted, all traceable to input — no hallucinations spotted
- Confidence scores felt calibrated (62/45/22/18%) not just round numbers
- Hypothesis 3 (external factor, 18%) actively argues against the 
  obvious answer — exactly the critical thinking the brief requires
- Blame attribution bias (Reasoning Risk 5) was sophisticated — 
  flagged systemic/process issues not just code bugs

CRITICAL OBSERVATIONS:
- Summary says "resolved by rolling back" — describes the fix, 
  not the cause. Slightly misleading framing.
- Assumption 5 ("async email interacts with database in some capacity")
  — the AI assumed this without any evidence in the input. 
  This is the AI filling gaps with plausible-sounding logic.
  Classic hallucination-adjacent behavior.
- All 4 hypotheses point to v2.3.1 as the cause. The AI never 
  seriously considered that the deployment timing was coincidental.
  = Temporal proximity bias in the AI itself, even though it flagged 
  this bias in the reasoning risks section. Ironic.

BIAS I NOTICED IN MYSELF:
- I found the output convincing because it sounded professional
  and detailed. That's automation bias. I didn't check whether
  Assumption 5 was supported by the input until looking carefully.

  ### Phase 3 — First full UI test
- Input: 3 lines of raw incident text
- Output: 8 facts, 6 assumptions, 5 timeline events, 
  4 hypotheses, 5 biases, 6 actions, 6 open questions
- Tool never claimed a definitive root cause ✓
- Hypothesis 4 (external factor, 15%) actively argues 
  against the obvious answer ✓
- Assumption 4 ("traffic was normal") — AI invented this 
  without any evidence in the input. Not hallucination 
  exactly, but the AI filling gaps. Worth discussing.
- The tool flagged temporal proximity bias but hypothesis #1 
  still leads with deployment as the cause. AI identified 
  its own potential bias but didn't fully correct for it.