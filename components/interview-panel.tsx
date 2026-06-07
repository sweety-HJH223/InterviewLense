'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { Send, Star, ExternalLink, Lightbulb, CheckCircle2, AlertTriangle, ChevronDown, CheckCircle, Briefcase, Bot, Sparkles, User, Search, Building } from 'lucide-react'
import { Button } from './ui/button'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'

// Interfaces
interface RewardItem { title: string; whyValued: string; howToShow: string; examplePhrase: string; }
interface RejectionItem { title: string; whatItLooksLike: string; howToAvoid: string; neverSay: string; }
interface Message { id: string; type: 'user' | 'interviewer'; content: string; timestamp: Date; feedback?: any; }
interface ResearchData { 
    company: string; role: string; website: string; logo_url: string; 
    hiring_process: string; interview_rounds: string[]; 
    what_they_reward: RewardItem[]; what_gets_rejected: RejectionItem[]; 
    what_to_study: string[]; insider_tips: string[]; 
    timeline: string; first_question: string; 
    how_to_prepare: string[];
}
interface RoundSummary { round_name: string; overall_score: number; verdict: 'STRONG PASS' | 'PASS' | 'BORDERLINE' | 'FAIL'; what_went_well: string[]; areas_to_improve: string[]; should_proceed: boolean; next_round_name: string | null; encouragement: string; }
interface FinalVerdict { decision: 'SELECTED' | 'REJECTED'; headline: string; overall_score: number; strengths: string[]; weaknesses: string[]; detailed_feedback: string; what_to_improve_for_next_time: string[]; }

function Card({children, className}: {children: React.ReactNode, className?: string}) {
    return <div className={`bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl ${className}`}>{children}</div>
}

function Section({title, icon: Icon, children}: {title: string, icon: any, children: React.ReactNode}) {
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

// Data - Fast local list for UI dropdowns
const COMPANIES = [
  { name: 'Google', industry: 'Big Tech', roles: ['Software Engineer L3/L4/L5', 'Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer', 'ML Engineer', 'Data Scientist', 'DevOps Engineer', 'Product Manager', 'UX Designer'] },
  { name: 'Amazon', industry: 'Big Tech', roles: ['SDE I/II/III', 'Backend Engineer', 'Cloud Engineer', 'AWS Solutions Architect', 'Data Engineer', 'ML Engineer', 'Product Manager', 'Operations Manager', 'Business Analyst', 'Security Engineer'] },
  { name: 'Meta', industry: 'Big Tech', roles: ['Software Engineer E3/E4/E5', 'Frontend Engineer', 'Backend Engineer', 'ML Engineer', 'Data Engineer', 'Product Designer', 'Product Manager', 'Research Scientist'] },
  { name: 'Microsoft', industry: 'Big Tech', roles: ['Software Engineer', 'Program Manager', 'Data Scientist', 'Cloud Solutions Architect', 'UX Researcher', 'Technical Sales'] },
  { name: 'Apple', industry: 'Big Tech', roles: ['SDE', 'Hardware Engineer', 'Product Designer', 'Firmware Engineer', 'Engineering Manager'] },
  { name: 'Netflix', industry: 'Big Tech', roles: ['SDE', 'Data Engineer', 'Product Manager', 'Content Designer', 'Security Engineer'] },
  { name: 'Uber', industry: 'Big Tech', roles: ['SDE', 'Product Manager', 'Data Scientist', 'Operations Manager'] },
  { name: 'Airbnb', industry: 'Big Tech', roles: ['SDE', 'Product Manager', 'Designer', 'Data Scientist'] },
  { name: 'Stripe', industry: 'Big Tech', roles: ['SDE', 'Data Engineer', 'Product Manager', 'Solutions Architect'] },
  { name: 'OpenAI', industry: 'Big Tech', roles: ['Research Scientist', 'SDE', 'ML Engineer', 'Policy Researcher'] },
  { name: 'Anthropic', industry: 'Big Tech', roles: ['Research Scientist', 'SDE', 'Safety Researcher'] },
  { name: 'Samsung', industry: 'Korean Tech', roles: ['SDE', 'Hardware Engineer', 'Research Scientist', 'Product Manager'] },
  { name: 'Kakao', industry: 'Korean Tech', roles: ['SDE', 'Product Manager', 'UX Designer', 'Data Scientist'] },
  { name: 'Naver', industry: 'Korean Tech', roles: ['SDE', 'Product Manager', 'Search Engineer', 'AI Researcher'] },
  { name: 'LG', industry: 'Korean Tech', roles: ['SDE', 'Hardware Engineer', 'R&D Engineer', 'Product Manager'] },
  { name: 'Krafton', industry: 'Korean Tech', roles: ['Game Developer', 'SDE', 'Game Designer', 'Data Analyst'] },
  { name: 'Coupang', industry: 'Korean Tech', roles: ['SDE', 'Data Engineer', 'Product Manager', 'Supply Chain Analyst'] },
  { name: 'Toss', industry: 'Korean Tech', roles: ['SDE', 'Product Manager', 'Data Scientist', 'Financial Analyst'] },
  { name: 'Kakaobank', industry: 'Finance', roles: ['SDE', 'Data Engineer', 'Financial Risk Analyst', 'Security Engineer'] },
  { name: 'Goldman Sachs', industry: 'Finance', roles: ['Analyst', 'Associate', 'Technology Analyst', 'Investment Banker'] },
  { name: 'JP Morgan', industry: 'Finance', roles: ['Analyst', 'Associate', 'Data Scientist', 'Quantitative Researcher'] },
  { name: 'McKinsey', industry: 'Finance', roles: ['Consultant', 'Business Analyst', 'Engagement Manager'] },
  { name: 'Deloitte', industry: 'Finance', roles: ['Consultant', 'Risk Analyst', 'Technology Consultant'] },
  { name: 'Accenture', industry: 'Finance', roles: ['Consultant', 'Software Engineer', 'Business Analyst'] },
  { name: 'Infosys', industry: 'Finance', roles: ['SDE', 'Consultant', 'System Analyst'] },
  { name: 'TCS', industry: 'Finance', roles: ['SDE', 'System Engineer', 'Project Manager'] },
  { name: 'Wipro', industry: 'Finance', roles: ['SDE', 'Consultant', 'System Engineer'] },
]

export function InterviewPanel() {
  const [step, setStep] = useState<'input' | 'intel' | 'interview' | 'verdict'>('input')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  
  // States
  const [error, setError] = useState<string | null>(null)
  const [isCompanyLoading, setIsCompanyLoading] = useState(false)
  const [isRoleLoading, setIsRoleLoading] = useState(false)
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const [customRole, setCustomRole] = useState('')

  const filteredCompanies = useMemo(() => 
    COMPANIES.filter(c => c.name.toLowerCase().includes(company.toLowerCase())), 
    [company]
  )

  const handleCompanySelect = (c: typeof COMPANIES[0]) => {
      setCompany(c.name)
      setShowCompanyDropdown(false)
      fetchRolesForCompany(c.name)
  }
  
  const [researchData, setResearchData] = useState<ResearchData | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [userInput, setUserInput] = useState('')
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null)
  
  // State for Multi-Round System
  const [currentRound, setCurrentRound] = useState(1)
  const [questionCount, setQuestionCount] = useState(0)
  const [roundSummaries, setRoundSummaries] = useState<RoundSummary[]>([])
  const [currentRoundSummary, setCurrentRoundSummary] = useState<RoundSummary | null>(null)
  const [finalVerdict, setFinalVerdict] = useState<FinalVerdict | null>(null)

  const [candidateId, setCandidateId] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCandidateId(user ? user.uid : null)
    })
    return () => unsubscribe()
  }, [])
  
  // (In handleSendMessage and endInterview, use `candidateId || 'anonymous-user'`)

  const handleStart = async () => {
    setIsCompanyLoading(true)
    setError(null)
    console.log('Starting research for:', company, role);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        const response = await fetch('/api/research', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ company, role }),
            signal: controller.signal
        })
        const result = await response.json()
        clearTimeout(timeoutId);
        
        console.log('Research API result:', result);
        if (!result.success) {
            setError(result.error)
            setIsCompanyLoading(false)
            return
        }
        setResearchData(result.data)
        setStep('intel')
    } catch (e: any) {
        clearTimeout(timeoutId);
        console.error('Research API Error:', e);
        setError(e.name === 'AbortError' ? "Request timed out." : "Failed to connect.")
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
        if (data.success) {
            setAvailableRoles(data.roles)
        } else {
            setError(data.error)
        }
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
    if (!userInput.trim()) return
    const userMessage: Message = {id: Date.now().toString() + Math.random().toString(), type: 'user', content: userInput, timestamp: new Date()}
    
    // 1. Fetch Feedback concurrently with interview context
    const feedbackResponse = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            company, role, researchData, 
            question: messages[messages.length - 1]?.content,
            answer: userInput,
            candidateId: candidateId || 'anonymous-user'
        })
    })
    const feedbackData = await feedbackResponse.json()
    if (feedbackData.success) {
        userMessage.feedback = feedbackData.data
    }

    setMessages(prev => [...prev, userMessage])
    setUserInput('')
    setQuestionCount(prev => prev + 1)
    
    if (questionCount + 1 >= 4) {
        setCurrentRoundSummary({
            round_name: researchData?.interview_rounds[currentRound - 1] || 'Interview', overall_score: 8, verdict: 'PASS',
            what_went_well: ['Communication', 'Clarity'], areas_to_improve: ['Experience depth'],
            should_proceed: true, next_round_name: researchData?.interview_rounds[currentRound] || null, encouragement: 'Great start!'
        })
    } else {
        try {
            const response = await fetch('/api/interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    company, role, researchData, 
                    conversationHistory: [...messages, userMessage],
                    userAnswer: userInput,
                    candidateId: candidateId || 'anonymous-user'
                })
            })
            const data = await response.json()
            if (data.success) {
                setMessages(prev => [...prev, {id: Date.now().toString() + Math.random().toString(), type: 'interviewer', content: data.question, timestamp: new Date()}])
            } else {
                setMessages(prev => [...prev, {id: Date.now().toString() + Math.random().toString(), type: 'interviewer', content: "Could you rephrase that? I didn't quite get it.", timestamp: new Date()}])
            }
        } catch (error) {
            setMessages(prev => [...prev, {id: Date.now().toString() + Math.random().toString(), type: 'interviewer', content: "I'm having trouble connecting to the interview service. Please try again.", timestamp: new Date()}])
        }
    }
  }

  const proceedToNextRound = () => {
      if (currentRoundSummary) {
          setRoundSummaries(prev => [...prev, currentRoundSummary])
          if (currentRound < (researchData?.interview_rounds.length || 1)) {
              setCurrentRound(prev => prev + 1)
              setQuestionCount(0)
              setCurrentRoundSummary(null)
              setMessages([{id: Date.now().toString() + Math.random().toString(), type: 'interviewer', content: "Starting next round...", timestamp: new Date()}])
          } else {
              endInterview()
          }
      }
  }

  const endInterview = async () => {
      const verdictResponse = await fetch('/api/final-verdict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ company, role, round_summaries: roundSummaries, candidateId: candidateId || 'anonymous-user' })
      })
      const data = await verdictResponse.json();
      setFinalVerdict(data.data)
      setStep('verdict')
  }

  // --- Render Functions ---
  if (step === 'input') return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        {/* Blobs */}
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
            </div>
            
            <div className="glass-card p-8 space-y-6">
                {error && <p className="text-red-400 text-sm">{error}</p>}
                
                {/* Company Input */}
                <div className="relative">
                    <label className="block text-sm font-semibold text-slate-400 mb-2.5">Target Company</label>
                    <div className="relative">
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
                    {showCompanyDropdown && company && (
                        <div className="absolute z-20 w-full mt-2 glass-card p-1 border-t-2 border-indigo-500 max-h-[300px] overflow-y-auto scrollbar-thin">
                            <p className="px-3 py-2 text-xs text-slate-500">{filteredCompanies.length} companies found</p>
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
                
                    {/* Role Dropdown */}
                {isRoleLoading && <div className="text-sm text-indigo-400 animate-pulse">Loading roles for {company}...</div>}
                {availableRoles.length > 0 && (
                  <div className="relative animate-in slide-in-from-top-4 duration-500">
                    <label className="block text-sm font-semibold text-slate-400 mb-2.5">Target Role</label>
                    <div 
                        className="glass-input w-full flex items-center justify-between cursor-pointer"
                        onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                    >
                        <span className={role ? 'text-white' : 'text-slate-500'}>{role || "Select a role"}</span>
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
                                    {role === r && <CheckCircle2 size={16} className="text-indigo-400" />}
                                </div>
                            ))}
                            <div className="p-2 border-t border-indigo-500/20">
                                <input 
                                    placeholder="Or type custom role..." 
                                    value={customRole}
                                    onChange={(e) => setCustomRole(e.target.value)}
                                    onKeyDown={(e) => { 
                                        if (e.key === 'Enter') { 
                                            setRole(customRole); 
                                            setIsRoleDropdownOpen(false); 
                                        } 
                                    }}
                                    className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 outline-none"
                                />
                            </div>
                        </div>
                    )}
                  </div>
                )}
                
                {company && role && (
                    <button onClick={handleStart} className="primary-button w-full bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/20">
                        {isCompanyLoading ? 'Researching...' : 'Start Interview'}
                    </button>
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
            {/* Card 1: Hiring Process */}
            <div className="glass-card p-6">
                <h3 className="font-semibold text-lg mb-4 text-indigo-400">Hiring Process</h3>
                <div className="space-y-4">
                    {researchData.hiring_process.split('\n').map((step, i) => (
                        <div key={i} className="flex gap-4 items-center">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">{i + 1}</div>
                            <p className="text-sm">{step}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Card 2: Interview Rounds */}
            <div className="glass-card p-6">
                <h3 className="font-semibold text-lg mb-4 text-purple-400">Interview Rounds</h3>
                <div className="flex flex-wrap gap-3">
                    {researchData.interview_rounds.map((round, i) => (
                        <span key={i} className="bg-purple-500/10 border border-purple-500/20 text-purple-300 px-4 py-2 rounded-full text-sm font-medium">{round}</span>
                    ))}
                </div>
            </div>

            {/* Card 3: What They Reward */}
            <div className="glass-card p-6 border-green-500/20">
                <h3 className="font-semibold text-lg mb-4 text-green-400">What They Reward</h3>
                <div className="space-y-4">
                    {researchData.what_they_reward.map((item, i) => (
                        <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <h4 className="font-bold text-sm text-green-300">{item.title}</h4>
                            {item.whyValued && <p className="text-xs text-slate-400 mt-1"><span className="font-semibold">Why:</span> {item.whyValued}</p>}
                            {item.howToShow && <p className="text-xs text-slate-400 mt-1"><span className="font-semibold">How:</span> {item.howToShow}</p>}
                            {item.examplePhrase && <p className="text-xs italic text-green-200/70 mt-2 bg-green-950/30 p-2 rounded">"{item.examplePhrase}"</p>}
                            {!item.whyValued && !item.howToShow && <p className="text-xs text-slate-500 italic">Loading details...</p>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Card 4: Rejection Reasons */}
            <div className="glass-card p-6 border-red-500/20">
                <h3 className="font-semibold text-lg mb-4 text-red-400">Rejection Reasons</h3>
                <div className="space-y-4">
                    {researchData.what_gets_rejected.map((item, i) => (
                        <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <h4 className="font-bold text-sm text-red-300">{item.title}</h4>
                            {item.whatItLooksLike && <p className="text-xs text-slate-400 mt-1"><span className="font-semibold">Looks Like:</span> {item.whatItLooksLike}</p>}
                            {item.howToAvoid && <p className="text-xs text-slate-400 mt-1"><span className="font-semibold">Avoid:</span> {item.howToAvoid}</p>}
                            {item.neverSay && <p className="text-xs italic text-red-200/70 mt-2 bg-red-950/30 p-2 rounded">Never say: "{item.neverSay}"</p>}
                            {!item.whatItLooksLike && !item.howToAvoid && <p className="text-xs text-slate-500 italic">Loading details...</p>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Card 5: What to Study */}
            <div className="glass-card p-6 md:col-span-2">
                <h3 className="font-semibold text-lg mb-4 text-indigo-400">What to Study</h3>
                <div className="flex flex-wrap gap-2">
                    {researchData.what_to_study.map((topic, i) => (
                        <span key={i} className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all hover:scale-105">
                            {topic}
                        </span>
                    ))}
                </div>
            </div>

            {/* Card 6: Insider Tips */}
            <div className="glass-card p-6 md:col-span-2">
                <h3 className="font-semibold text-lg mb-4 text-amber-400">Insider Tips</h3>
                <ul className="space-y-4">
                    {researchData.insider_tips.map((tip, i) => (
                        <li key={i} className="border-l-4 border-amber-500 pl-4 py-1 text-sm flex items-start gap-2">
                            <span>💡</span> {tip}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Card 7: How to Prepare */}
            <div className="glass-card p-6">
                <h3 className="font-semibold text-lg mb-4 text-blue-400">How to Prepare</h3>
                <ul className="space-y-2">
                    {researchData.how_to_prepare.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                            <input type="checkbox" className="accent-indigo-500" /> {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Card 8: Timeline */}
            <div className="glass-card p-6">
                <h3 className="font-semibold text-lg mb-4 text-indigo-400">Timeline</h3>
                <div className="w-full bg-slate-800 rounded-full h-4">
                    <div className="bg-indigo-600 h-4 rounded-full" style={{width: '60%'}}></div>
                </div>
                <p className="text-sm text-slate-400 mt-2">{researchData.timeline}</p>
            </div>
        </div>
    </main>
  )

  if (step === 'interview') return (
    <main className="flex flex-col h-screen bg-[#080810]">
        {/* Sticky Header */}
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
            <div className="flex gap-1.5">
                {[1, 2, 3].map(dot => <div key={dot} className={`w-2 h-2 rounded-full ${dot <= questionCount ? 'bg-indigo-500' : 'bg-slate-700'}`} />)}
            </div>
        </header>

        {/* Chat Area */}
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
                                <button onClick={() => setExpandedFeedback(m.id === expandedFeedback ? null : m.id)} className="text-xs text-indigo-400 hover:underline">
                                    {expandedFeedback === m.id ? 'Hide Feedback' : 'Show Feedback'}
                                </button>
                                {expandedFeedback === m.id && (
                                    <div className="mt-2 glass-card p-4 text-sm space-y-2 animate-in fade-in max-w-[80%]">
                                        <p className="font-bold">Score: {m.feedback.score}/10</p>
                                        <p className="text-green-400">Strengths: {m.feedback.strengths.join(', ')}</p>
                                        <p className="text-red-400">Improvements: {m.feedback.improvements.join(', ')}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>

        {/* Input Area */}
        <footer className="border-t border-[var(--surface-border)] px-6 py-4 bg-[#080810]">
            <div className="glass-card flex items-end p-2 gap-2">
                <textarea 
                    value={userInput} 
                    onChange={e => setUserInput(e.target.value)} 
                    className="flex-1 bg-transparent px-3 py-2 outline-none resize-none min-h-[44px]" 
                    placeholder="Type your answer..."
                    rows={1}
                />
                <button onClick={handleSendMessage} className="bg-[var(--primary)] text-white p-3 rounded-[12px]"><Send size={20}/></button>
            </div>
            <p className="text-xs text-slate-500 mt-2 px-2">{userInput.length} characters</p>
        </footer>

        {/* End of Round Summary */}
        {currentRoundSummary && (
            <div className="fixed inset-0 bg-[#080810]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                <div className="glass-card max-w-md w-full p-8 text-center space-y-6">
                    <h2 className="text-2xl font-bold">Round Summary</h2>
                    <div className="flex justify-center">
                        <div className="w-24 h-24 rounded-full border-4 border-indigo-500/20 flex items-center justify-center text-2xl font-bold text-indigo-400">
                           {currentRoundSummary.overall_score}/10
                        </div>
                    </div>
                    <div className="space-y-3">
                        {currentRoundSummary.what_went_well.map((t, i) => <p key={i} className="text-green-400 text-sm flex items-center gap-2"><CheckCircle2 size={16}/> {t}</p>)}
                        {currentRoundSummary.areas_to_improve.map((t, i) => <p key={i} className="text-red-400 text-sm flex items-center gap-2"><AlertTriangle size={16}/> {t}</p>)}
                    </div>
                    <button onClick={proceedToNextRound} className="primary-button w-full">Next Round</button>
                </div>
            </div>
        )}
    </main>
  )
  
  if (step === 'verdict' && finalVerdict) return (
      <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-slate-950 text-slate-50">
          <h1 className={`text-7xl font-extrabold mb-6 ${finalVerdict.decision === 'SELECTED' ? 'text-emerald-500' : 'text-rose-500'}`}>{finalVerdict.decision}</h1>
          <p className="text-3xl font-semibold mb-10 max-w-2xl">{finalVerdict.headline}</p>
          <Card className="w-full max-w-lg text-left mb-10 border-slate-700">
              <p className="font-bold text-lg mb-4 text-indigo-400">Feedback Breakdown</p>
              <p className="text-slate-300 text-sm mb-6 leading-relaxed">{finalVerdict.detailed_feedback}</p>
              <div className="flex flex-wrap gap-2"> {finalVerdict.strengths.map((s, i) => <span key={i} className="bg-emerald-950/50 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-semibold border border-emerald-900/50">{s}</span>)} </div>
          </Card>
          <Button onClick={() => { setStep('input'); setResearchData(null); setMessages([]); }} className="bg-slate-800 px-8 py-3 rounded-full hover:bg-slate-700 transition">Start New Interview</Button>
      </main>
  )
  return null
}
