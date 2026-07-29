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