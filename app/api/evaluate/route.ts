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
    const { company, role, researchData, question, answer, candidateId, resumeText } = await req.json()

    // 1. Fetch Candidate Memory
    const memory = candidateId ? await getCandidateMemory(candidateId) : null;

    const model = getModel(false)

    interface RewardItem { title: string; whyValued: string; }
    interface RejectionItem { title: string; whatItLooksLike: string; }

    const whatTheyReward = Array.isArray(researchData?.what_they_reward)
      ? researchData.what_they_reward.map((r: RewardItem) => `${r.title} (${r.whyValued})`).join(', ')
      : 'technical excellence, clear communication'
    const whatGetsRejected = Array.isArray(researchData?.what_gets_rejected)
      ? researchData.what_gets_rejected.map((r: RejectionItem) => `${r.title} (${r.whatItLooksLike})`).join(', ')
      : 'vague answers, no examples'
    const culturalNotes = researchData?.cultural_notes ?? `${company} values professionalism`

    const resumeContext = resumeText 
      ? `CANDIDATE BACKGROUND/RESUME: ${resumeText}`
      : "No resume provided. Evaluate based on general professional standards."

    const prompt = `
    You are a top-tier hiring coach for ${company} (${role}).

    ${resumeContext}
    CANDIDATE MEMORY: ${memory ? `Total interviews: ${memory.totalInterviews}. Known Strengths: ${memory.cumulativeStrengths.join(', ')}. Known Weaknesses: ${memory.cumulativeWeaknesses.join(', ')}.` : 'First interview.'}

    EVALUATION CRITERIA:
    - Reward: ${whatTheyReward}
    - Rejection: ${whatGetsRejected}
    - Culture: ${culturalNotes}

    Task: Evaluate candidate's answer to "${question}".
    Answer: "${answer}"

    SCORING RUBRIC:
    - 1-3: Casual, vague, slang-filled, lacks STAR method, or fails to address the question.
    - 4-6: Basic, generic, lacks concrete examples or specific details.
    - 7-8: Professional, clear, uses STAR, directly addresses criteria.
    - 9-10: Exceptional, demonstrates deep expertise, perfectly tailored to company culture.

    RULES:
    1. If the answer is causal, slang-filled, or brief ("umm", "yeah"), the score MUST be 3 or below.
    2. If a resume was provided, check if the candidate leveraged their experience effectively. Penalize for generic answers that ignore their background.
    3. If behavioral, STAR method (Situation, Task, Action, Result) is MANDATORY. Penalize if missing.
    4. Your evaluation MUST be professional, direct, and identify specific gaps based on the criteria.

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
