import { NextRequest, NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'
import fs from 'fs'
import path from 'path'
import { getCandidateMemory } from '@/lib/memory'

const logAgent = (agent: string, input: any, output: any) => {
  const logPath = path.join(process.cwd(), 'agent-logs.json')
  const entry = {
    timestamp: new Date().toISOString(),
    agent,
    input,
    output,
  }
  
  let logs = []
  try {
    const existing = fs.readFileSync(logPath, 'utf-8')
    logs = JSON.parse(existing)
  } catch {}
  
  logs.push(entry)
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2))
}

export async function POST(req: NextRequest) {
  try {
    const { company, role, researchData, question, answer, candidateId } = await req.json()

    // 1. Fetch Candidate Memory
    const memory = candidateId ? await getCandidateMemory(candidateId) : null;

    const model = getModel(false)

    const whatTheyReward = Array.isArray(researchData?.what_they_reward)
      ? researchData.what_they_reward.map(r => `${r.title} (${r.whyValued})`).join(', ')
      : 'technical excellence, clear communication'
    const whatGetsRejected = Array.isArray(researchData?.what_gets_rejected)
      ? researchData.what_gets_rejected.map(r => `${r.title} (${r.whatItLooksLike})`).join(', ')
      : 'vague answers, no examples'
    const culturalNotes = researchData?.cultural_notes ?? `${company} values professionalism`

    const prompt = `
You are a hiring coach for ${company} (${role}).

CANDIDATE MEMORY: ${memory ? `Total interviews: ${memory.totalInterviews}. Known Strengths: ${memory.cumulativeStrengths.join(', ')}. Known Weaknesses: ${memory.cumulativeWeaknesses.join(', ')}.` : 'First interview.'}

EVALUATION CRITERIA:
- Reward: ${whatTheyReward}
- Rejection: ${whatGetsRejected}
- Culture: ${culturalNotes}

Task: Evaluate candidate's answer to "${question}".
Answer: "${answer}"

RULES:
1. Penalize brief/unprofessional answers (score < 4).
2. Require STAR method for behavioral answers.
3. Be brutal, professional, and actionable.

Return ONLY this JSON (no markdown):
{
  "score": <number>,
  "verdict": "<string>",
  "strengths": ["<string>"],
  "improvements": ["<string>"],
  "better_answer": "<string>",
  "cultural_tip": "<string>"
}`

    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    const data = JSON.parse(clean)
    logAgent('Agent C - Evaluator', { question, answer }, data)
    return NextResponse.json({ success: true, data })
} catch (error) {
    console.error('Agent C error:', error)
    return NextResponse.json({ 
      success: false, 
      error: "Could not generate evaluation. Please try again."
    })
  }
}
