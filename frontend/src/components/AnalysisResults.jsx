import { useState, useEffect } from 'react'

export default function AnalysisResults({ analysis }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SummaryCard summary={analysis.summary} />
      <FactsAssumptionsCard facts={analysis.facts} assumptions={analysis.assumptions} />
      <TimelineCard timeline={analysis.timeline} />
      <HypothesesCard hypotheses={analysis.hypotheses} />
      <ReasoningRisksCard risks={analysis.reasoning_risks} />
      <NextActionsCard actions={analysis.next_actions} />
      <OpenQuestionsCard questions={analysis.open_questions} />
    </div>
  )
}

/* ── Summary ─────────────────────────────────────────────────── */
function SummaryCard({ summary }) {
  return (
    <div className="card">
      <h2 className="card-title">
        <span className="card-title-icon">📋</span>
        Incident Summary
      </h2>
      <p className="summary-text">{summary}</p>
    </div>
  )
}

/* ── Facts vs Assumptions ────────────────────────────────────── */
function FactsAssumptionsCard({ facts, assumptions }) {
  return (
    <div className="card">
      <h2 className="card-title">
        <span className="card-title-icon">🔬</span>
        Evidence Analysis
      </h2>
      <div className="facts-grid">
        <div>
          <p className="facts-col-title facts-col-title-green">
            ✓ Confirmed Facts
            <span style={{ fontWeight: 400, color: 'var(--text-faint)', marginLeft: 4 }}>
              ({facts.length})
            </span>
          </p>
          <ul className="evidence-list evidence-list-green">
            {facts.map((f, i) => <li key={i}>{f}</li>)}
          </ul>
        </div>
        <div>
          <p className="facts-col-title facts-col-title-amber">
            ⚠ Unverified Assumptions
            <span style={{ fontWeight: 400, color: 'var(--text-faint)', marginLeft: 4 }}>
              ({assumptions.length})
            </span>
          </p>
          <ul className="evidence-list evidence-list-amber">
            {assumptions.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}

/* ── Timeline ────────────────────────────────────────────────── */
function TimelineCard({ timeline }) {
  return (
    <div className="card">
      <h2 className="card-title">
        <span className="card-title-icon">⏱</span>
        Timeline
      </h2>
      <div className="table-wrap">
        <table className="timeline-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((e, i) => (
              <tr key={i}>
                <td className="ts-cell">{e.timestamp}</td>
                <td>{e.event}</td>
                <td className="src-cell">{e.evidence_source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Hypotheses ──────────────────────────────────────────────── */
function HypothesesCard({ hypotheses }) {
  const sorted = [...hypotheses].sort((a, b) => b.confidence - a.confidence)
  return (
    <div className="card">
      <h2 className="card-title">
        <span className="card-title-icon">🔍</span>
        Root-Cause Hypotheses
      </h2>
      <p className="card-subtitle">
        Ranked by confidence — all are candidates until the recommended test is run.
      </p>
      <div className="hypotheses-list">
        {sorted.map((h, i) => (
          <HypothesisRow key={i} hypothesis={h} rank={i + 1} />
        ))}
      </div>
    </div>
  )
}

function HypothesisRow({ hypothesis: h, rank }) {
  return (
    <div className="hypothesis">
      <div className="hyp-header">
        <span className="hyp-rank">#{rank}</span>
        <h3 className="hyp-title">{h.title}</h3>
        <span className="hyp-pct">{Math.round(h.confidence * 100)}%</span>
      </div>

      <ConfidenceBar confidence={h.confidence} />

      <div className="hyp-evidence">
        <div>
          <p className="evidence-col-label evidence-col-label-green">✓ Evidence For</p>
          <ul className="hyp-evidence-items evidence-for-items">
            {h.evidence_for.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
        <div>
          <p className="evidence-col-label evidence-col-label-red">✕ Evidence Against</p>
          <ul className="hyp-evidence-items evidence-against-items">
            {h.evidence_against.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      </div>

      <div className="hyp-test">
        <p className="hyp-test-label">🧪 Recommended Test</p>
        <p className="hyp-test-text">{h.recommended_test}</p>
      </div>
    </div>
  )
}

function ConfidenceBar({ confidence }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(confidence * 100), 60)
    return () => clearTimeout(t)
  }, [confidence])

  return (
    <div className="confidence-track">
      <div className="confidence-fill" style={{ width: `${width}%` }} />
    </div>
  )
}

/* ── Reasoning Risks ─────────────────────────────────────────── */
function ReasoningRisksCard({ risks }) {
  return (
    <div className="card">
      <h2 className="card-title">
        <span className="card-title-icon">🧠</span>
        Reasoning Risks &amp; Cognitive Biases
      </h2>
      <div className="risks-list">
        {risks.map((r, i) => (
          <div key={i} className="risk-item">
            <div className="risk-name">{r.bias_or_fallacy}</div>
            <div className="risk-body">
              <p>
                <span className="risk-dl">Where it appears: </span>
                {r.where_it_appears}
              </p>
              <p>
                <span className="risk-dl">Mitigation: </span>
                {r.mitigation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Next Actions ────────────────────────────────────────────── */
function NextActionsCard({ actions }) {
  return (
    <div className="card">
      <h2 className="card-title">
        <span className="card-title-icon">✅</span>
        Next Actions
      </h2>
      <div className="actions-list">
        {actions.map((a, i) => (
          <div key={i} className="action-item">
            <div className="action-body">
              <span className="action-text">{a.action}</span>
              <span className="action-evidence">{a.linked_evidence}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Open Questions ──────────────────────────────────────────── */
function OpenQuestionsCard({ questions }) {
  return (
    <div className="card">
      <h2 className="card-title">
        <span className="card-title-icon">❓</span>
        Open Questions
      </h2>
      <ul className="questions-list">
        {questions.map((q, i) => (
          <li key={i}>
            <span className="q-mark">?</span>
            {q}
          </li>
        ))}
      </ul>
    </div>
  )
}
