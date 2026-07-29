const PLACEHOLDER = `Paste raw incident logs, on-call notes, alert descriptions, Slack threads,
or any incident data here. The more context you provide, the better the analysis.

Example:
  14:23 UTC - PagerDuty alert: checkout error rate > 5%
  14:31 UTC - Deployment of v2.3.1 completed 36 min earlier
  14:35 UTC - DB connection pool exhausted (100/100)
  ...`

export default function IncidentInput({ value, onChange, onAnalyze, isLoading, error }) {
  function handleKey(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') onAnalyze()
  }

  return (
    <section className="input-section">
      <label className="input-label" htmlFor="incident-text">
        Incident logs &amp; description
      </label>

      <textarea
        id="incident-text"
        className="incident-textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={PLACEHOLDER}
        rows={10}
        disabled={isLoading}
        spellCheck={false}
      />

      {error && <p className="input-error">⚠ {error}</p>}

      <div className="input-footer">
        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          {value.length > 0 ? `${value.length.toLocaleString()} chars` : 'Cmd+Enter to analyze'}
        </span>
        <button
          className="btn btn-primary"
          onClick={onAnalyze}
          disabled={isLoading || !value.trim()}
        >
          {isLoading ? 'Analyzing…' : '🔍 Analyze Incident'}
        </button>
      </div>
    </section>
  )
}
