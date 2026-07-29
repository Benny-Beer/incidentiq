"""Run a sample incident through the AI service and print the parsed result."""
import json
import sys
from pathlib import Path

# Add backend/ to sys.path so `app` is importable as a package
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from app.ai_service import analyze_incident  # noqa: E402

SAMPLE_INCIDENT = """
INCIDENT REPORT
Date: 2024-01-15
Reported by: On-call engineer Jane Smith (SRE team)

SUMMARY
Checkout service experienced elevated error rates between 14:23 and 14:48 UTC.
3,847 transactions failed. Service recovered after rollback of v2.3.1.

TIMELINE (from monitoring and logs)
- 13:55 UTC: Deployment of checkout-service v2.3.1 completed successfully per CI/CD pipeline.
- 14:23 UTC: PagerDuty alert fired — checkout error rate exceeded 5% threshold.
- 14:25 UTC: On-call engineer acknowledged alert and began investigation.
- 14:31 UTC: Engineer noted deployment 36 minutes prior; checked Datadog APM.
- 14:35 UTC: checkout-service logs showed database connection pool exhaustion (max 100 connections reached).
- 14:38 UTC: Database CPU observed at 45%, within normal operating range (30–60%).
- 14:40 UTC: Database query latency measured at 2× normal baseline (80ms vs 40ms typical).
- 14:42 UTC: Rollback of checkout-service to v2.3.0 initiated.
- 14:48 UTC: Error rate returned to <0.1%. Connection pool utilization dropped to 12%.
- 15:00 UTC: Post-incident monitoring period declared stable.

OBSERVATIONS
- Error rate peaked at 23% during the incident window.
- 3,847 failed checkout transactions (total attempted: 16,726).
- Database connection pool hit maximum of 100 connections during incident.
- New feature introduced in v2.3.1: asynchronous order confirmation email sending.
- Payment service: no errors observed during the incident window.
- Inventory service: no errors observed during the incident window.
- No infrastructure changes outside the checkout-service deployment.
- Database connection pool limit has not been changed in 6 months.

HISTORICAL CONTEXT
- A similar connection exhaustion incident occurred 3 months ago after deployment of
  v2.1.0. Root cause at that time was a connection leak in the session management
  module, fixed in v2.1.1.
- v2.3.1 release notes mention the new async email feature but no changes to
  database layer or connection handling.
- v2.3.1 code diff was reviewed by 2 engineers; no reviewer flagged database concerns.
"""


def main():
    print("Analyzing sample incident...\n")
    result = analyze_incident(SAMPLE_INCIDENT)

    print("=== INCIDENT ANALYSIS ===\n")
    print(f"SUMMARY:\n{result.summary}\n")

    print(f"FACTS ({len(result.facts)}):")
    for f in result.facts:
        print(f"  • {f}")

    print(f"\nASSUMPTIONS ({len(result.assumptions)}):")
    for a in result.assumptions:
        print(f"  • {a}")

    print(f"\nTIMELINE ({len(result.timeline)} events):")
    for e in result.timeline:
        print(f"  [{e.timestamp}] {e.event}")
        print(f"    Source: {e.evidence_source}")

    print(f"\nHYPOTHESES ({len(result.hypotheses)}):")
    for i, h in enumerate(result.hypotheses, 1):
        print(f"\n  {i}. {h.title} (confidence: {h.confidence:.0%})")
        print(f"     For:     {'; '.join(h.evidence_for[:2])}")
        print(f"     Against: {'; '.join(h.evidence_against[:2])}")
        print(f"     Test:    {h.recommended_test}")

    print(f"\nREASONING RISKS ({len(result.reasoning_risks)}):")
    for r in result.reasoning_risks:
        print(f"  • [{r.bias_or_fallacy}] {r.where_it_appears}")
        print(f"    Mitigation: {r.mitigation}")

    print(f"\nNEXT ACTIONS ({len(result.next_actions)}):")
    for a in result.next_actions:
        print(f"  • {a.action}")
        print(f"    Evidence: {a.linked_evidence}")

    print(f"\nOPEN QUESTIONS ({len(result.open_questions)}):")
    for q in result.open_questions:
        print(f"  ? {q}")

    print("\n=== RAW JSON (first 500 chars) ===")
    print(json.dumps(result.model_dump(), indent=2)[:500] + "...")


if __name__ == "__main__":
    main()
