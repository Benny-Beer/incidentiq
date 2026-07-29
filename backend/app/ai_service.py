import json
import anthropic
from pydantic import ValidationError

from .prompts import SYSTEM_PROMPT
from .schemas import IncidentAnalysis

_client = anthropic.Anthropic()

_SYSTEM_BLOCK = [{"type": "text", "text": SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}]


def _call_model(user_content: str) -> str:
    response = _client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8192,
        system=_SYSTEM_BLOCK,
        messages=[{"role": "user", "content": user_content}],
    )
    return response.content[0].text


def _parse_and_validate(raw: str) -> IncidentAnalysis:
    data = json.loads(raw)
    return IncidentAnalysis.model_validate(data)


def analyze_incident(incident_text: str) -> IncidentAnalysis:
    """Call Claude to analyze an incident. Retries once if the response is not valid JSON."""
    raw = _call_model(incident_text)

    try:
        return _parse_and_validate(raw)
    except (json.JSONDecodeError, ValidationError) as first_error:
        retry_prompt = (
            f"{incident_text}\n\n"
            f"---\n"
            f"NOTE: Your previous response could not be parsed. "
            f"Error: {first_error}\n\n"
            f"Return ONLY a valid JSON object matching the required schema. "
            f"No markdown, no code fences, no text outside the JSON."
        )
        raw = _call_model(retry_prompt)
        return _parse_and_validate(raw)
