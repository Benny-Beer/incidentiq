import { useState, useEffect } from 'react'

export default function ReportPanel({ report, onClose }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback for environments where clipboard API is unavailable
      const el = document.createElement('textarea')
      el.value = report
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="report-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="report-panel" role="dialog" aria-modal="true" aria-label="Postmortem report">
        <div className="report-header">
          <h2>📄 Postmortem Report — Markdown</h2>
          <div className="report-header-actions">
            <button
              className={`btn btn-sm ${copied ? 'btn-copied' : 'btn-secondary'}`}
              onClick={handleCopy}
            >
              {copied ? '✓ Copied!' : '📋 Copy Markdown'}
            </button>
            <button className="btn btn-sm btn-ghost" onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>
        <pre className="report-body">{report}</pre>
      </div>
    </div>
  )
}
