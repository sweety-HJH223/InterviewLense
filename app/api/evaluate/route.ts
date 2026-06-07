import { NextRequest, NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'
import fs from 'fs'
import path from 'path'

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
    const { company, role, researchData, question, answer } = await req.json()

    const model = getModel(false)

    const whatTheyReward = Array.isArray(researchData?.what_they_reward)
      ? researchData.what_they_reward.join(', ')
      : 'technical excellence, clear communication'
    const whatGetsRejected = Array.isArray(researchData?.what_gets_rejected)
      ? researchData.what_gets_rejected.join(', ')
      : 'vague answers, no examples'
    const culturalNotes = researchData?.cultural_notes ?? `${company} values professionalism`

    const prompt = `
You are a hiring coach for ${company} evaluating a ${role} candidate.
You MUST strictly evaluate the candidate's answer based on the following specific requirements:

They reward: ${whatTheyReward}
Rejection reasons: ${whatGetsRejected}
Culture: ${culturalNotes}

Question: "${question}"
Answer: "${answer}"

CRITICAL INSTRUCTION: If the answer does not directly address these requirements, penalize the score heavily. Do not provide a generic evaluation. Be brutal and specific.

Return ONLY this JSON:
{
  "score": <number between 1-10>,
  "verdict": "<string>",
  "strengths": ["<string>", "<string>"],
  "improvements": ["<string>", "<string>"],
  "better_answer": "A stronger answer for ${company} would...",
  "cultural_tip": "At ${company}, interviewers specifically want..."
}

ONLY valid JSON. No markdown.`

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