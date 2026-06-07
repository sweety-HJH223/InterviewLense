'use client'

import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

interface Message {
  id: string
  type: 'user' | 'interviewer'
  content: string
  timestamp: Date
}

export function InterviewPracticeApp() {
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [hasStarted, setHasStarted] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'interviewer',
      content: "Hello! Thanks for taking the time to interview with us today. Let's get started with some questions.",
      timestamp: new Date(),
    },
  ])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStartInterview = () => {
    if (company.trim() && role.trim()) {
      setHasStarted(true)
    }
  }

  const handleSendMessage = async () => {
    if (!userInput.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setUserInput('')
    setIsLoading(true)

    // Simulate interviewer response
    setTimeout(() => {
      const interviewerResponses = [
        `Great answer! That aligns well with our needs for the ${role} role at ${company}. Can you tell me more about your approach?`,
        'I appreciate your perspective. How did you handle challenges in similar situations?',
        "That's an interesting approach. What would you do differently if you faced this challenge again?",
        'Excellent point. Can you walk me through a specific example from your experience?',
        "I see. Let's dive deeper into your technical skills. What technologies are you most comfortable with?",
      ]

      const randomResponse =
        interviewerResponses[Math.floor(Math.random() * interviewerResponses.length)]

      const interviewerMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'interviewer',
        content: randomResponse,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, interviewerMessage])
      setIsLoading(false)
    }, 800)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!hasStarted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
            <div className="mb-8">
              <h1 className="text-balance text-3xl font-bold text-foreground">Interview Practice</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Practice your interview skills in a realistic chat environment
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g., Google, Microsoft, Vercel"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleStartInterview()
                  }}
                  className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Role Title</label>
                <input
                  type="text"
                  placeholder="e.g., Senior Developer, Product Manager"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleStartInterview()
                  }}
                  className="w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring"
                />
              </div>

              <button
                onClick={handleStartInterview}
                disabled={!company.trim() || !role.trim()}
                className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground font-medium py-2.5 rounded-md transition-colors disabled:opacity-50"
              >
                Start Interview
              </button>

              <p className="text-xs text-muted-foreground text-center">
                Prepare for your next interview with realistic questions and feedback
              </p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-4 shadow-sm sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground">{company}</h1>
            <p className="text-sm text-muted-foreground">{role}</p>
          </div>
          <button
            onClick={() => {
              setHasStarted(false)
              setMessages([
                {
                  id: '1',
                  type: 'interviewer',
                  content:
                    "Hello! Thanks for taking the time to interview with us today. Let's get started with some questions.",
                  timestamp: new Date(),
                },
              ])
              setCompany('')
              setRole('')
            }}
            className="px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-secondary transition-colors text-foreground"
          >
            New Session
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs rounded-lg px-4 py-3 sm:max-w-md lg:max-w-lg ${
                  message.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground border border-border'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <span className="text-xs opacity-70 mt-2 block">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary text-secondary-foreground border border-border rounded-lg px-4 py-3">
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

      {/* Input Area */}
      <div className="border-t border-border bg-card px-4 py-4 sm:px-6">
        <div className="flex gap-2">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your answer here... (Shift+Enter for new line)"
            disabled={isLoading}
            rows={1}
            className="flex-1 rounded-md border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50 resize-none"
          />
          <button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 disabled:bg-muted disabled:opacity-50 text-primary-foreground px-4 rounded-md transition-colors inline-flex items-center justify-center"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  )
}
