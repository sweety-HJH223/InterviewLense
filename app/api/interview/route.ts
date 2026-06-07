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
  let logs: any[] = []
  try {
    const existing = fs.readFileSync(logPath, 'utf-8')
    logs = JSON.parse(existing)
  } catch {}
  logs.push(entry)
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, role, researchData, conversationHistory, userAnswer } = body

    const model = getModel(false)

    const culturalNotes = researchData?.cultural_notes ?? `${company} values professional competence`
    const whatTheyReward = Array.isArray(researchData?.what_they_reward)
      ? researchData.what_they_reward.join(', ')
      : 'technical excellence, clear communication'
    const whatGetsRejected = Array.isArray(researchData?.what_gets_rejected)
      ? researchData.what_gets_rejected.join(', ')
      : 'vague answers, no concrete examples'

    const prompt = `
You are a senior interviewer at ${company} interviewing for ${role}.
You MUST generate a follow-up question that is specifically tailored to the culture and expectations of ${company}.

Culture: ${culturalNotes}
They reward: ${whatTheyReward}
Rejection reasons: ${whatGetsRejected}

Conversation:
${conversationHistory.map((m: any) => `${m.type === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`).join('\n')}

Candidate said: "${userAnswer}"

CRITICAL INSTRUCTION: Generate ONE specific, challenging follow-up question that tests for the rewarded traits or addresses gaps in the candidate's answer. Do not use generic interview questions. 2-3 sentences max. Interviewer only.`

    const result = await model.generateContent(prompt)
    const question = result.response.text().trim()

    logAgent('Agent B - Interviewer', { company, role, userAnswer }, { question })

    return NextResponse.json({ success: true, question })

  } catch (error: any) {
    console.error('=== AGENT B ERROR ===', error?.message)
    return NextResponse.json({
      success: false,
      error: "Could not generate interview question. Please try again."
    })
  }
}