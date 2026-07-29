import { useState } from 'react'
import './App.css'
import IncidentInput from './components/IncidentInput'
import AnalysisResults from './components/AnalysisResults'
import ReportPanel from './components/ReportPanel'

export default function App() {
  const [incidentText, setIncidentText] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState(null)
  const [report, setReport] = useState(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [showReport, setShowReport] = useState(false)

  async function handleAnalyze() {
    if (!incidentText.trim()) return
    setIsAnalyzing(true)
    setAnalyzeError(null)
    setAnalysis(null)
    setReport(null)
    setShowReport(false)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident_text: incidentText }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || `Server error ${res.status}`)
      }
      setAnalysis(await res.json())
    } catch (e) {
      setAnalyzeError(e.message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function handleGenerateReport() {
    if (!analysis) return
    setIsGeneratingReport(true)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analysis),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      const data = await res.json()
      setReport(data.report)
      setShowReport(true)
    } catch (e) {
      console.error('Report generation failed:', e)
    } finally {
      setIsGeneratingReport(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">IncidentIQ</span>
          </div>
          <span className="logo-divider">·</span>
          <span className="logo-sub">AI-powered incident analysis &amp; postmortem</span>
        </div>
      </header>

      <main className="main">
        <IncidentInput
          value={incidentText}
          onChange={setIncidentText}
          onAnalyze={handleAnalyze}
          isLoading={isAnalyzing}
          error={analyzeError}
        />

        {isAnalyzing && <LoadingState />}

        {analysis && !isAnalyzing && (
          <>
            <div className="results-toolbar">
              <span className="results-meta">
                <strong>{analysis.hypotheses.length}</strong> hypotheses ·{' '}
                <strong>{analysis.timeline.length}</strong> timeline events ·{' '}
                <strong>{analysis.facts.length}</strong> facts
              </span>
              <button
                className="btn btn-secondary"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
              >
                {isGeneratingReport ? 'Generating…' : '📄 Generate Postmortem Report'}
              </button>
            </div>

            <AnalysisResults analysis={analysis} />
          </>
        )}
      </main>

      {showReport && report && (
        <ReportPanel
          report={report}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="loading-wrap">
      <div className="loading-bar-track">
        <div className="loading-bar-fill" />
      </div>
      <p className="loading-text">Analyzing incident with Claude — this takes ~15 seconds…</p>
    </div>
  )
}
