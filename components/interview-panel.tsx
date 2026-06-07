'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Star, ChevronDown, ChevronUp, ExternalLink, BotMessageSquare } from 'lucide-react'
import { Button } from './ui/button'

interface Message {
  id: string
  type: 'user' | 'interviewer'
  content: string
  timestamp: Date
  evaluation?: {
    score: number
    verdict: string
    strengths: string[]
    improvements: string[]
    better_answer: string
    cultural_tip: string
  }
}

interface ResearchData {
  company: string
  role: string
  website: string
  logo_url: string
  hiring_focus: string
  interview_rounds: string[]
  what_they_reward: string[]
  what_gets_rejected: string[]
  cultural_notes: string
  recent_questions: string[]
  first_question: string
}

export function InterviewPanel() {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const [isResearching, setIsResearching] = useState(false)
  const [researchData, setResearchData] = useState<ResearchData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false) // Track individual eval loading
  const [expandedEval, setExpandedEval] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSaveSession = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/save-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          role,
          messages,
          agentLogs: [], // Assuming logs aren't fully implemented yet
        }),
      });
      if (response.ok) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      }
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStartInterview = async () => {
    if (!company.trim() || !role.trim()) return

    setIsResearching(true)
    setHasStarted(true)

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role }),
      })
      const result = await res.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Could not find company or role.')
      }
      
      const { data } = result
      setResearchData(data)

      const firstQuestion = data.first_question
      setCurrentQuestion(firstQuestion)

      setMessages([{
        id: '1',
        type: 'interviewer',
        content: `Hello! I'm interviewing you today for the ${role} position at ${company}. ${firstQuestion}`,
        timestamp: new Date(),
      }])
    } catch (error: any) {
      alert(error.message)
      setHasStarted(false)
    } finally {
      setIsResearching(false)
    }
  }

  const handleGetFeedback = async (messageId: string, answer: string) => {
    setIsEvaluating(true)
    try {
      const evalRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          role,
          researchData,
          question: currentQuestion, // Note: This might be inaccurate in multi-turn
          answer,
        }),
      })

      const evalData = await evalRes.json()
      if (!evalData.success) throw new Error(evalData.error)

      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, evaluation: evalData.data } : m
      ))
    } catch (error) {
      alert('Failed to get feedback. Please try again.')
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleSendMessage = async () => {
    if (!userInput.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const answer = userInput
    setUserInput('')
    setIsLoading(true)

    try {
      const interviewRes = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          role,
          researchData,
          conversationHistory: messages,
          userAnswer: answer,
        }),
      })

      const interviewData = await interviewRes.json()
      if (!interviewData.success) throw new Error(interviewData.error)

      setCurrentQuestion(interviewData.question)

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'interviewer',
        content: interviewData.question,
        timestamp: new Date(),
      }])
    } catch (error) {
      console.error('Interview loop error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'interviewer',
        content: 'I apologize, I am having trouble processing that answer. Could you please try again?',
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleReset = () => {
    setHasStarted(false)
    setResearchData(null)
    setMessages([])
    setCompany('')
    setRole('')
    setCurrentQuestion('')
  }

  if (!hasStarted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Star className="h-4 w-4 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">InterviewLens</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                AI researches how your target company actually interviews — then simulates it.
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g., Google, Kakao, Stripe"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Role Title</label>
                <input
                  type="text"
                  placeholder="e.g., Backend Engineer, Product Manager"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter') handleStartInterview() }}
                  className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>

              <Button
                onClick={handleStartInterview}
                disabled={!company.trim() || !role.trim()}
                className="w-full"
              >
                Start Interview
              </Button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="border-b border-border bg-card px-4 py-4 shadow-sm sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {researchData?.logo_url && (
              <img src={researchData.logo_url} alt={`${company} logo`} className="w-10 h-10 rounded-full object-contain border border-border" />
            )}
            <div>
              <h1 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {company}
                {researchData?.website && (
                  <a href={researchData.website} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </h1>
              <p className="text-sm text-muted-foreground">{role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length >= 3 && (
              <Button
                onClick={handleSaveSession}
                variant="outline"
                className="text-sm"
                disabled={isSaving || isSaved}
              >
                {isSaved ? 'Saved!' : isSaving ? 'Saving...' : 'Save Session'}
              </Button>
            )}
            <Button onClick={handleReset} variant="outline" className="text-sm">
              New Session
            </Button>
          </div>
        </div>
      </div>

      {isResearching && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="flex gap-2 justify-center">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <p className="text-sm text-muted-foreground">
              Researching how {company} interviews for {role}...
            </p>
          </div>
        </div>
      )}

      {!isResearching && (
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((message) => (
              <div key={message.id}>
                <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-lg px-4 py-3 sm:max-w-md lg:max-w-lg ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground border border-border'
                  }`}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <span className="text-xs opacity-70 mt-2 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.type === 'user' && !message.evaluation && (
                      <button
                        onClick={() => handleGetFeedback(message.id, message.content)}
                        disabled={isEvaluating}
                        className="mt-2 flex items-center gap-1 text-xs bg-primary-foreground/20 hover:bg-primary-foreground/30 rounded px-2 py-1"
                      >
                        <BotMessageSquare className="h-3 w-3" />
                        Get Feedback
                      </button>
                    )}
                  </div>
                </div>

                {message.type === 'user' && message.evaluation && (
                  <div className="flex justify-end mt-2">
                    <div className="max-w-xs sm:max-w-md lg:max-w-lg w-full">
                      <div className="border border-border rounded-lg bg-card overflow-hidden">
                        <button
                          onClick={() => setExpandedEval(expandedEval === message.id ? null : message.id)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`text-lg font-bold ${
                              message.evaluation.score >= 7 ? 'text-green-600' :
                              message.evaluation.score >= 5 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {message.evaluation.score}/10
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {message.evaluation.verdict}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {expandedEval === message.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </div>
                        </button>

                        {expandedEval === message.id && (
                          <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                            <div>
                              <p className="text-xs font-semibold text-green-600 mb-1">✓ Strengths</p>
                              {message.evaluation.strengths.map((s, i) => <p key={i} className="text-xs text-muted-foreground">• {s}</p>)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-yellow-600 mb-1">↑ Improve</p>
                              {message.evaluation.improvements.map((s, i) => <p key={i} className="text-xs text-muted-foreground">• {s}</p>)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-blue-600 mb-1">💡 Better Answer</p>
                              <p className="text-xs text-muted-foreground">{message.evaluation.better_answer}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-purple-600 mb-1">🏢 {company} Tip</p>
                              <p className="text-xs text-muted-foreground">{message.evaluation.cultural_tip}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary border border-border rounded-lg px-4 py-3">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {!isResearching && (
        <div className="border-t border-border bg-card px-4 py-4 sm:px-6">
          <div className="max-w-3xl mx-auto flex gap-2">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
              disabled={isLoading}
              rows={1}
              className="flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50 resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isLoading}
              className="px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </main>
  )
}