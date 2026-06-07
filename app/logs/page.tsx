'use client'

import { useEffect, useState } from 'react'

interface LogEntry {
  timestamp: string
  agent: string
  input: any
  output: any
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/logs')
      .then(r => r.json())
      .then(d => {
        setLogs(d.logs || [])
        setLoading(false)
      })
  }, [])

  const agentColor = (agent: string) => {
    if (agent.includes('A')) return 'border-blue-500 bg-blue-50'
    if (agent.includes('B')) return 'border-purple-500 bg-purple-50'
    if (agent.includes('C')) return 'border-green-500 bg-green-50'
    return 'border-gray-300 bg-gray-50'
  }

  const agentBadge = (agent: string) => {
    if (agent.includes('A')) return 'bg-blue-500'
    if (agent.includes('B')) return 'bg-purple-500'
    if (agent.includes('C')) return 'bg-green-500'
    return 'bg-gray-500'
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Loading agent logs...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">🤖 Agent Pipeline Logs</h1>
          <p className="text-gray-400 mt-1">Live view of all 3 AI agents communicating</p>
          <div className="flex gap-3 mt-4">
            <span className="flex items-center gap-2 text-xs bg-blue-900 text-blue-300 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Agent A — Researcher
            </span>
            <span className="flex items-center gap-2 text-xs bg-purple-900 text-purple-300 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              Agent B — Interviewer
            </span>
            <span className="flex items-center gap-2 text-xs bg-green-900 text-green-300 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Agent C — Evaluator
            </span>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-4xl mb-4">🔍</p>
            <p>No logs yet. Start an interview session first.</p>
            <a href="/" className="mt-4 inline-block text-blue-400 underline">
              Go to InterviewLens →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {[...logs].reverse().map((log, i) => (
              <div key={i} className={`border-l-4 rounded-lg p-4 ${agentColor(log.agent)}`}
                style={{ borderColor: log.agent.includes('A') ? '#3b82f6' : log.agent.includes('B') ? '#a855f7' : '#22c55e' }}>

                {/* Agent Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs text-white px-2 py-1 rounded-full font-bold ${agentBadge(log.agent)}`}>
                      {log.agent}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Input */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">📥 Input</p>
                  <div className="bg-white bg-opacity-60 rounded p-3 text-xs text-gray-800 font-mono overflow-auto max-h-40">
                    {log.agent.includes('A') && (
                      <div>
                        <p><span className="font-bold">Company:</span> {log.input.company}</p>
                        <p><span className="font-bold">Role:</span> {log.input.role}</p>
                      </div>
                    )}
                    {log.agent.includes('B') && (
                      <div>
                        <p><span className="font-bold">Company:</span> {log.input.company}</p>
                        <p><span className="font-bold">Candidate said:</span> {log.input.userAnswer}</p>
                      </div>
                    )}
                    {log.agent.includes('C') && (
                      <div>
                        <p><span className="font-bold">Question:</span> {log.input.question}</p>
                        <p className="mt-1"><span className="font-bold">Candidate answer:</span> {log.input.answer}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Output */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">📤 Output</p>
                  <div className="bg-white bg-opacity-60 rounded p-3 text-xs text-gray-800 font-mono overflow-auto max-h-60">
                    {log.agent.includes('A') && (
                      <div className="space-y-1">
                        <p><span className="font-bold">Rounds:</span> {log.output.interview_rounds?.join(' → ')}</p>
                        <p><span className="font-bold">They reward:</span> {log.output.what_they_reward?.join(', ')}</p>
                        <p><span className="font-bold">Culture:</span> {log.output.cultural_notes}</p>
                        <p><span className="font-bold">First question:</span> {log.output.first_question}</p>
                      </div>
                    )}
                    {log.agent.includes('B') && (
                      <div>
                        <p><span className="font-bold">Next question:</span> {log.output.question}</p>
                      </div>
                    )}
                    {log.agent.includes('C') && (
                      <div className="space-y-1">
                        <p><span className="font-bold">Score:</span> {log.output.score}/10 — {log.output.verdict}</p>
                        <p><span className="font-bold">Strengths:</span> {log.output.strengths?.join(', ')}</p>
                        <p><span className="font-bold">Improve:</span> {log.output.improvements?.join(', ')}</p>
                        <p><span className="font-bold">Tip:</span> {log.output.cultural_tip}</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.reload()}
            className="text-xs text-gray-400 border border-gray-700 px-4 py-2 rounded hover:bg-gray-800"
          >
            Refresh Logs
          </button>
          <span className="mx-3 text-gray-700">|</span>
          <a href="/" className="text-xs text-blue-400 hover:underline">
            ← Back to InterviewLens
          </a>
        </div>

      </div>
    </div>
  )
}