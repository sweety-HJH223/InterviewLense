'use client'

import { useState, useMemo, useRef, useEffect, ReactNode } from 'react'
import { Send, Star, CheckCircle, AlertTriangle, ChevronDown, User, Search, Building, Upload, FileText, Loader2 } from 'lucide-react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth'

interface RewardItem { title: string; whyValued: string; howToShow: string; examplePhrase: string; }
interface RejectionItem { title: string; whatItLooksLike: string; howToAvoid: string; neverSay: string; }
interface Message { id: string; type: 'user' | 'interviewer'; content: string; timestamp: Date; feedback?: any; }
interface ResearchData { 
    company: string; role: string; hiring_focus: string; interview_rounds: string[]; 
    what_they_reward: string[]; what_gets_rejected: string[]; 
    first_question: string;
}
interface RoundSummary { round_name: string; overall_score: number; verdict: 'STRONG PASS' | 'PASS' | 'BORDERLINE' | 'FAIL'; what_went_well: string[]; areas_to_improve: string[]; should_proceed: boolean; next_round_name: string | null; encouragement: string; }
interface FinalVerdict { decision: 'SELECTED' | 'NOT SELECTED'; headline: string; overall_score: number; strengths: string[]; weaknesses: string[]; detailed_feedback: string; what_to_improve_for_next_time: string[]; }

function Card({children, className}: {children: ReactNode, className?: string}) {
    return <div className={`bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl ${className}`}>{children}</div>
}

function Section({title, icon: Icon, children}: {title: string, icon: any, children: ReactNode}) {
    return (
        <details className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 group shadow-lg">
            <summary className="flex justify-between items-center font-bold text-slate-300 uppercase tracking-widest text-xs cursor-pointer list-none">
                <span className="flex items-center gap-2 text-indigo-400"><Icon size={16}/> {title}</span>
                <ChevronDown className="group-open:rotate-180 transition text-slate-500" />
            </summary>
            <div className="mt-4 text-slate-300">{children}</div>
        </details>
    )
}

const COMPANIES = [
  { name: 'Google', industry: 'Big Tech' },
  { name: 'Amazon', industry: 'Big Tech' },
  { name: 'Meta', industry: 'Big Tech' },
  { name: 'Microsoft', industry: 'Big Tech' },
  { name: 'Apple', industry: 'Big Tech' },
  { name: 'Netflix', industry: 'Big Tech' },
  { name: 'Uber', industry: 'Big Tech' },
  { name: 'Airbnb', industry: 'Big Tech' },
  { name: 'Stripe', industry: 'Big Tech' },
  { name: 'OpenAI', industry: 'Big Tech' },
  { name: 'Anthropic', industry: 'Big Tech' },
  { name: 'Samsung', industry: 'Korean Tech' },
  { name: 'Hyundai', industry: 'Korean Tech' },
  { name: 'SK Hynix', industry: 'Korean Tech' },
  { name: 'Kakao', industry: 'Korean Tech' },
  { name: 'Naver', industry: 'Korean Tech' },
  { name: 'LG', industry: 'Korean Tech' },
  { name: 'Krafton', industry: 'Korean Tech' },
  { name: 'Coupang', industry: 'Korean Tech' },
  { name: 'Toss', industry: 'Korean Tech' },
  { name: 'Kakaobank', industry: 'Finance' },
  { name: 'Tesla', industry: 'Automotive/Tech' },
  { name: 'SpaceX', industry: 'Aerospace' },
  { name: 'Goldman Sachs', industry: 'Finance' },
  { name: 'JP Morgan', industry: 'Finance' },
  { name: 'McKinsey', industry: 'Finance' },
  { name: 'Deloitte', industry: 'Finance' },
  { name: 'Accenture', industry: 'Finance' },
  { name: 'Infosys', industry: 'Finance' },
  { name: 'TCS', industry: 'Finance' },
  { name: 'Wipro', industry: 'Finance' },
]

export function InterviewPanel() {
  const [step, setStep] = useState<'input' | 'intel' | 'interview' | 'verdict'>('input')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isCompanyLoading, setIsCompanyLoading] = useState(false)
  const [isRoleLoading, setIsRoleLoading] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const [customRole, setCustomRole] = useState('')
  const [resumeText, setResumeText] = useState('')
  const [isParsingPdf, setIsParsingPdf] = useState(false)
  const [researchData, setResearchData] = useState<ResearchData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)
  const [currentRound, setCurrentRound] = useState(1)
  const [questionCount, setQuestionCount] = useState(0)
  const [roundSummaries, setRoundSummaries] = useState<RoundSummary[]>([])
  const [currentRoundSummary, setCurrentRoundSummary] = useState<RoundSummary | null>(null)
  const [finalVerdict, setFinalVerdict] = useState<FinalVerdict | null>(null)
  const [candidateId, setCandidateId] = useState<string | null>(null)
  const [user, setUser] = useState<FirebaseUser | null>(null)

const handleGoogleSignIn = async () => {
  const provider = new GoogleAuthProvider()
  try {
    await signInWithPopup(auth, provider)
  } catch (err) {
    console.error('Sign-in failed:', err)
  }
}

const handleSignOut = async () => {
  await signOut(auth)
}
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const filteredCompanies = useMemo(() => 
    COMPANIES.filter(c => c.name.toLowerCase().includes(company.toLowerCase())), 
    [company]
  )

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setCandidateId(user ? user.uid : null)
    })
    return () => unsubscribe()
  }, [])

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file.')
      return
    }

    setIsParsingPdf(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (result.success) {
        setResumeText(result.text)
      } else {
        setError(result.error || 'Failed to parse PDF.')
      }
    } catch {
      setError('Error uploading PDF.')
    } finally {
      setIsParsingPdf(false)
    }
  }

  const handleCompanySelect = (c: typeof COMPANIES[0]) => {
    setCompany(c.name)
    setShowCompanyDropdown(false)
    fetchRolesForCompany(c.name)
  }

  const handleStart = async () => {
    setIsCompanyLoading(true)
    setError(null)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role }),
        signal: controller.signal
      })
      const result = await response.json()
      clearTimeout(timeoutId)
      if (!result.success) { setError(result.error); return }
      setResearchData(result.data)
      setStep('intel')
    } catch (e: any) {
      clearTimeout(timeoutId)
      setError(e.name === 'AbortError' ? 'Request timed out.' : 'Failed to connect.')
    } finally {
      setIsCompanyLoading(false)
    }
  }

  const fetchRolesForCompany = async (companyName: string) => {
    if (!companyName) return
    setIsRoleLoading(true)
    setError(null)
    setAvailableRoles([])
    setRole('')
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: companyName })
      })
      const data = await response.json()
      if (data.success) setAvailableRoles(data.roles)
      else setError(data.error)
    } finally {
      setIsRoleLoading(false)
    }
  }

  const handleBeginInterview = () => {
    if (!researchData) return
    setMessages([{ id: '1', type: 'interviewer', content: `Hello! I'm interviewing you for the ${role} position at ${company}. ${researchData.first_question}`, timestamp: new Date() }])
    setStep('interview')
  }

  const handleSendMessage = async () => {
    if (!userInput.trim() || isSending || currentRoundSummary) return
    setIsSending(true)

    const userMessage: Message = {
      id: Date.now().toString() + Math.random().toString(),
      type: 'user',
      content: userInput,
      timestamp: new Date()
    }

    try {
      const feedbackResponse = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company, role, researchData, 
          question: messages[messages.length - 1]?.content,
          answer: userInput,
          candidateId: candidateId || 'anonymous-user',
          resumeText
        })
      })
      const feedbackData = await feedbackResponse.json()
      if (feedbackData.success) userMessage.feedback = feedbackData.data
    } catch {}

    setMessages(prev => [...prev, userMessage])
    setUserInput('')
    const newCount = questionCount + 1
    setQuestionCount(newCount)

    if (newCount >= 4) {
      try {
        const summaryRes = await fetch('/api/round-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company,
            role,
            messages: [...messages, userMessage],
            round_number: currentRound,
          }),
        })
        const summaryData = await summaryRes.json()
        if (summaryData.success) {
          setCurrentRoundSummary(summaryData.data)
        } else {
          setCurrentRoundSummary({
            round_name: researchData?.interview_rounds[currentRound - 1] || 'Interview',
            overall_score: 5,
            verdict: 'BORDERLINE',
            what_went_well: ['Completed the round'],
            areas_to_improve: ['Add more specific examples with metrics'],
            should_proceed: true,
            next_round_name: researchData?.interview_rounds[currentRound] || null,
            encouragement: 'Keep working on structured answers.'
          })
        }
      } catch {
        setCurrentRoundSummary({
          round_name: `Round ${currentRound}`,
          overall_score: 5,
          verdict: 'BORDERLINE',
          what_went_well: ['Completed the round'],
          areas_to_improve: ['Add more specific examples'],
          should_proceed: true,
          next_round_name: null,
          encouragement: 'Keep going!'
        })
      }
    } else {
      try {
        const response = await fetch('/api/interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            company, role, researchData, 
            conversationHistory: [...messages, userMessage],
            userAnswer: userInput,
            candidateId: candidateId || 'anonymous-user',
            resumeText
          })
        })
        const data = await response.json()
        if (data.success) {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + Math.random().toString(),
            type: 'interviewer',
            content: data.question,
            timestamp: new Date()
          }])
        } else {
          setMessages(prev => [...prev, {
            id: Date.now().toString() + Math.random().toString(),
            type: 'interviewer',
            content: "Could you rephrase that? I didn't quite get it.",
            timestamp: new Date()
          }])
        }
      } catch {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + Math.random().toString(),
          type: 'interviewer',
          content: "I'm having trouble connecting. Please try again.",
          timestamp: new Date()
        }])
      }
    }
    setIsSending(false)
  }

  const proceedToNextRound = () => {
    if (!currentRoundSummary) return
    const updatedSummaries = [...roundSummaries, currentRoundSummary]
    setRoundSummaries(updatedSummaries)
    
    if (currentRound < (researchData?.interview_rounds.length || 1)) {
      const nextRoundName = currentRoundSummary.next_round_name || 'Round ' + (currentRound + 1)
      setCurrentRound(prev => prev + 1)
      setQuestionCount(0)
      setCurrentRoundSummary(null)
      setMessages([{
        id: Date.now().toString() + Math.random().toString(),
        type: 'interviewer',
        content: 'Welcome to ' + nextRoundName + ". Let's continue. Can you walk me through your most significant technical achievement?",
        timestamp: new Date()
      }])
    } else {
      endInterview(updatedSummaries)
    }
  }

  const endInterview = async (summaries = roundSummaries) => {
    try {
      const verdictResponse = await fetch('/api/final-verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          company, role, 
          round_summaries: summaries, 
          candidateId: candidateId || 'anonymous-user',
          resumeText
        })
      })
      const data = await verdictResponse.json()
      setFinalVerdict(data.data)
      try {
        await fetch('/api/save-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: candidateId || 'anonymous-user',
            company,
            role,
            messages,
            agentLogs: summaries,
            finalVerdict: data.data, 
          })
        })
      } catch (err) {
        console.error('Failed to save session:', err)
      }
    } catch {
      setFinalVerdict({
        decision: 'NOT SELECTED',
        headline: 'Interview Evaluation Incomplete',
        overall_score: 0,
        strengths: ['N/A'],
        weaknesses: ['Interview ended prematurely or system error'],
        detailed_feedback: 'We could not generate a full verdict due to insufficient data or a connection issue.',
        what_to_improve_for_next_time: ['Try to complete all interview rounds.']
      })
    }
    setStep('verdict')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (step === 'input') return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[120px] animate-pulse delay-1000"></div>
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-2xl mb-4 bg-white/5 border border-white/10 shadow-lg">
            <Star className="text-indigo-400 w-10 h-10" style={{ filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))' }} />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-50 tracking-tight">Ace Your Next Interview</h1>
          <div className="pt-2">
  {user ? (
    <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
      <span>Signed in as {user.displayName}</span>
      <a href="/sessions" className="text-indigo-400 hover:underline">Past Interviews</a>
      <button onClick={handleSignOut} className="text-indigo-400 hover:underline">Sign out</button>
    </div>
  ) : (
    <button 
      onClick={handleGoogleSignIn} 
      className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 transition"
    >
      Sign in with Google
    </button>
  )}
</div>
        </div>
        <div className="glass-card p-8 space-y-6">
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="relative">
            <label className="block text-sm font-semibold text-slate-400 mb-2.5">Target Company</label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Building className="absolute left-4 top-4 text-slate-500" size={20} />
                <input 
                  placeholder="e.g. Google" 
                  value={company} 
                  onChange={e => { setCompany(e.target.value); setError(null); setShowCompanyDropdown(true); }} 
                  onFocus={() => setShowCompanyDropdown(true)}
                  className="glass-input w-full pl-12"
                  autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false"
                />
              </div>
              <button 
                onClick={() => { setShowCompanyDropdown(false); fetchRolesForCompany(company); }}
                disabled={!company.trim() || isRoleLoading}
                className="bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 rounded-xl px-4 transition flex items-center justify-center disabled:opacity-50"
              >
                {isRoleLoading ? <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> : <Search size={20} className="text-indigo-400" />}
              </button>
            </div>
            {showCompanyDropdown && company && (
              <div className="absolute z-20 w-full mt-2 glass-card p-1 border-t-2 border-indigo-500 max-h-[300px] overflow-y-auto scrollbar-thin">
                <div className="px-3 py-2 border-b border-white/5 flex justify-between items-center">
                  <p className="text-xs text-slate-500">{filteredCompanies.length} companies found</p>
                  {filteredCompanies.length === 0 && (
                    <button 
                      onClick={() => { setShowCompanyDropdown(false); fetchRolesForCompany(company); }}
                      className="text-[10px] text-indigo-400 hover:underline uppercase font-bold"
                    >
                      Search Dynamic →
                    </button>
                  )}
                </div>
                {filteredCompanies.map(c => (
                  <button key={c.name} onClick={() => handleCompanySelect(c)} className="w-full text-left p-3 rounded-lg hover:bg-gradient-to-r hover:from-indigo-900/40 hover:to-purple-900/40 flex items-center justify-between group border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center">
                        <img src={`https://www.google.com/s2/favicons?domain=${c.name.toLowerCase()}.com&sz=32`} alt={c.name} className="w-6 h-6" onError={(e) => { e.currentTarget.parentElement!.innerHTML = `<span class="text-xs font-bold">${c.name.charAt(0)}</span>`; e.currentTarget.parentElement!.classList.add('bg-indigo-900'); }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-100">{c.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{c.industry}</p>
                      </div>
                    </div>
                    <span className="text-slate-600 group-hover:text-indigo-400">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {isRoleLoading && <div className="text-sm text-indigo-400 animate-pulse">Loading roles for {company}...</div>}
          {availableRoles.length > 0 && (
            <div className="relative animate-in slide-in-from-top-4 duration-500">
              <label className="block text-sm font-semibold text-slate-400 mb-2.5">Target Role</label>
              <div 
                className="glass-input w-full flex items-center justify-between cursor-pointer"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              >
                <span className={role ? 'text-white' : 'text-slate-500'}>{role || 'Select a role'}</span>
                <ChevronDown className={`transition-transform ${isRoleDropdownOpen ? 'rotate-180' : ''}`} size={20} />
              </div>
              {isRoleDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[#1a1a2e] border border-indigo-500/30 rounded-[12px] max-h-[250px] overflow-y-auto shadow-xl">
                  {availableRoles.map(r => (
                    <div 
                      key={r} 
                      onClick={() => { setRole(r); setIsRoleDropdownOpen(false); }}
                      className={`p-4 cursor-pointer hover:bg-indigo-500/15 flex justify-between items-center transition ${role === r ? 'bg-indigo-500/25' : ''}`}
                    >
                      <span>{r}</span>
                      {role === r && <CheckCircle size={16} className="text-indigo-400" />}
                    </div>
                  ))}
                  <div className="p-2 border-t border-indigo-500/20">
                    <input 
                      placeholder="Or type custom role..." 
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { setRole(customRole); setIsRoleDropdownOpen(false); } }}
                      className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          {company && role && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative">
                <label className="block text-sm font-semibold text-slate-400 mb-2.5 flex justify-between">
                  <span>Your Background / Resume</span>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-bold">
                      <Upload size={12} />
                      {isParsingPdf ? 'Reading PDF...' : 'Upload PDF'}
                      <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={isParsingPdf} />
                    </label>
                    <span className="text-[10px] text-slate-500 uppercase">Optional</span>
                  </div>
                </label>
                <div className="relative">
                  <textarea 
                    placeholder="Paste your experience, skills, or resume here for a personalized interview..."
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    className="glass-input w-full min-h-[120px] py-3 text-sm resize-none"
                    disabled={isParsingPdf}
                  />
                  {isParsingPdf && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center flex-col gap-2">
                      <Loader2 className="text-indigo-400 animate-spin" size={24} />
                      <p className="text-xs text-indigo-300 font-medium">AI is reading your resume...</p>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Paste your text or upload a PDF. This helps the AI tailor questions.</p>
              </div>

              <button onClick={handleStart} className="primary-button w-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20">
                {isCompanyLoading ? 'Researching...' : 'Start Interview'}
              </button>
            </div>
          )}
        </div>
        <p className="text-center text-xs text-slate-500">Powered by Gemini AI</p>
      </div>
    </main>
  )

  if (step === 'intel' && researchData) return (
    <main className="min-h-screen bg-[#080810] text-slate-100 p-6 md:p-12">
      <header className="sticky top-0 z-10 bg-[#080810]/80 backdrop-blur-md border-b border-[var(--surface-border)] pb-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{researchData.company}</h1>
          <p className="text-slate-400">{researchData.role}</p>
        </div>
        <button onClick={handleBeginInterview} className="primary-button bg-gradient-to-r from-indigo-600 to-purple-600">Begin Interview →</button>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-lg mb-4 text-indigo-400">Hiring Focus</h3>
          <p className="text-sm">{researchData.hiring_focus}</p>
        </div>
        <div className="glass-card p-6">
          <h3 className="font-semibold text-lg mb-4 text-purple-400">Interview Rounds</h3>
          <div className="flex flex-wrap gap-3">
            {researchData.interview_rounds.map((round, i) => (
              <span key={i} className="bg-purple-500/10 border border-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm font-medium">{round}</span>
            ))}
          </div>
        </div>
        <div className="glass-card p-6 border-green-500/20">
          <h3 className="font-semibold text-lg mb-4 text-green-400">What They Reward</h3>
          <ul className="space-y-2">
            {researchData.what_they_reward.map((item, i) => (
              <li key={i} className="text-sm text-slate-300">• {item}</li>
            ))}
          </ul>
        </div>
        <div className="glass-card p-6 border-red-500/20">
          <h3 className="font-semibold text-lg mb-4 text-red-400">Rejection Reasons</h3>
          <ul className="space-y-2">
            {researchData.what_gets_rejected.map((item, i) => (
              <li key={i} className="text-sm text-slate-300">• {item}</li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )

  if (step === 'interview') return (
    <main className="flex flex-col h-screen bg-[#080810]">
      <header className="border-b border-[var(--surface-border)] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#080810]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center text-xs font-bold text-indigo-300">
            {company.charAt(0)}
          </div>
          <div>
            <h2 className="font-semibold">{company} Interview</h2>
            <p className="text-xs text-slate-400">Round {currentRound}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {[1, 2, 3, 4].map(dot => (
              <div key={dot} className={`w-2 h-2 rounded-full ${dot <= questionCount ? 'bg-indigo-500' : 'bg-slate-700'}`} />
            ))}
          </div>
          <button 
            onClick={() => endInterview()}
            className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition"
          >
            End
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6">
        {messages.map(m => (
          <div key={m.id} className={`flex gap-4 ${m.type === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.type === 'user' ? 'bg-slate-700' : 'bg-indigo-600'}`}>
              {m.type === 'user' ? <User size={16}/> : <Star size={16}/>}
            </div>
            <div className="flex flex-col gap-2">
              <div className={`rounded-[20px] px-5 py-3 max-w-[80%] ${m.type === 'user' ? 'bg-[var(--primary)] text-white rounded-tr-[4px]' : 'bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-tl-[4px]'}`}>
                {m.content}
              </div>
              {m.type === 'user' && m.feedback && (
                <div className="flex flex-col items-end">
                  <button 
                    onClick={() => setExpandedFeedback(m.id === expandedFeedback ? null : m.id)} 
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    {expandedFeedback === m.id ? 'Hide Feedback' : `Show Feedback (${m.feedback.score}/10)`}
                  </button>
                  {expandedFeedback === m.id && (
                    <div className="mt-2 glass-card p-4 text-sm space-y-2 animate-in fade-in max-w-[80%]">
                      <p className={`font-bold text-lg ${m.feedback.score >= 7 ? 'text-green-400' : m.feedback.score >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {m.feedback.score}/10 — {m.feedback.verdict}
                      </p>
                      <div>
                        <p className="text-xs font-semibold text-green-400 mb-1">✓ Strengths</p>
                        {m.feedback.strengths.map((s: string, i: number) => <p key={i} className="text-xs text-slate-300">• {s}</p>)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-yellow-400 mb-1">↑ Improve</p>
                        {m.feedback.improvements.map((s: string, i: number) => <p key={i} className="text-xs text-slate-300">• {s}</p>)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-blue-400 mb-1">💡 Better Answer</p>
                        <p className="text-xs text-slate-300">{m.feedback.better_answer}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-purple-400 mb-1">🏢 {company} Tip</p>
                        <p className="text-xs text-slate-300">{m.feedback.cultural_tip}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Star size={16}/>
            </div>
            <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-[20px] rounded-tl-[4px] px-5 py-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"/>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}/>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}/>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <footer className="border-t border-[var(--surface-border)] px-6 py-4 bg-[#080810]">
        <div className="glass-card flex items-end p-2 gap-2">
          <textarea 
            value={userInput} 
            onChange={e => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-transparent px-3 py-2 outline-none resize-none min-h-[44px] text-white placeholder-slate-500" 
            placeholder="Type your answer... (Enter to send)"
            rows={1}
            disabled={isSending || !!currentRoundSummary}
          />
          <button 
            onClick={handleSendMessage} 
            disabled={isSending || !!currentRoundSummary || !userInput.trim()}
            className="bg-[var(--primary)] text-white p-3 rounded-[12px] disabled:opacity-50"
          >
            <Send size={20}/>
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-2 px-2">{userInput.length} characters</p>
      </footer>
      {currentRoundSummary && (
        <div className="fixed inset-0 bg-[#080810]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-card max-w-md w-full p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold">{currentRoundSummary.round_name} Complete</h2>
            <div className="flex justify-center">
              <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-2xl font-bold ${
                currentRoundSummary.overall_score >= 7 ? 'border-green-500/40 text-green-400' :
                currentRoundSummary.overall_score >= 5 ? 'border-yellow-500/40 text-yellow-400' :
                'border-red-500/40 text-red-400'
              }`}>
                {currentRoundSummary.overall_score}/10
              </div>
            </div>
            <span className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${
              currentRoundSummary.verdict === 'STRONG PASS' ? 'bg-green-950/50 text-green-300 border border-green-900' :
              currentRoundSummary.verdict === 'PASS' ? 'bg-blue-950/50 text-blue-300 border border-blue-900' :
              currentRoundSummary.verdict === 'BORDERLINE' ? 'bg-yellow-950/50 text-yellow-300 border border-yellow-900' :
              'bg-red-950/50 text-red-300 border border-red-900'
            }`}>
              {currentRoundSummary.verdict}
            </span>
            <p className="text-slate-400 text-sm italic">"{currentRoundSummary.encouragement}"</p>
            <div className="space-y-2 text-left">
              {currentRoundSummary.what_went_well.map((t, i) => (
                <p key={i} className="text-green-400 text-sm flex items-center gap-2"><CheckCircle size={16}/> {t}</p>
              ))}
              {currentRoundSummary.areas_to_improve.map((t, i) => (
                <p key={i} className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle size={16}/> {t}</p>
              ))}
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => { 
                  const updatedSummaries = [...roundSummaries, currentRoundSummary!];
                  setRoundSummaries(updatedSummaries);
                  setCurrentRoundSummary(null); 
                  endInterview(updatedSummaries); 
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl transition text-sm"
              >
                End Interview
              </button>
              {currentRoundSummary.should_proceed && currentRound < (researchData?.interview_rounds.length || 1) && (
                <button onClick={proceedToNextRound} className="flex-1 primary-button">
                  Next Round →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )

  if (step === 'verdict' && finalVerdict) return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-950 text-slate-50">
      <h1 className={`text-7xl font-extrabold mb-6 ${finalVerdict.decision === 'SELECTED' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {finalVerdict.decision}
      </h1>
      <p className="text-3xl font-semibold mb-10 max-w-2xl">{finalVerdict.headline}</p>
      <Card className="w-full max-w-lg text-left mb-10 border-slate-700">
        <p className="font-bold text-lg mb-4 text-indigo-400">Feedback Breakdown</p>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed">{finalVerdict.detailed_feedback}</p>
        <div className="flex flex-wrap gap-2">
          {finalVerdict.strengths.map((s, i) => (
            <span key={i} className="bg-emerald-950/50 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-semibold border border-emerald-900/50">{s}</span>
          ))}
        </div>
      </Card>
      <button 
        onClick={() => { setStep('input'); setResearchData(null); setMessages([]); setCurrentRound(1); setQuestionCount(0); setRoundSummaries([]); setCurrentRoundSummary(null); setFinalVerdict(null); }} 
        className="bg-slate-800 px-8 py-3 rounded-full hover:bg-slate-700 transition"
      >
        Start New Interview
      </button>
    </main>
  )

  return null
}
