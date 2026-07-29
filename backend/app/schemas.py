from pydantic import BaseModel, Field
from typing import List


class TimelineEvent(BaseModel):
    timestamp: str
    event: str
    evidence_source: str


class Hypothesis(BaseModel):
    title: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_for: List[str]
    evidence_against: List[str]
    recommended_test: str


class ReasoningRisk(BaseModel):
    bias_or_fallacy: str
    where_it_appears: str
    mitigation: str


class NextAction(BaseModel):
    action: str
    linked_evidence: str


class IncidentAnalysis(BaseModel):
    summary: str
    facts: List[str]
    assumptions: List[str]
    timeline: List[TimelineEvent]
    hypotheses: List[Hypothesis]
    reasoning_risks: List[ReasoningRisk]
    next_actions: List[NextAction]
    open_questions: List[str]
