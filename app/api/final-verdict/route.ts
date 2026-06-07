import { NextRequest, NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'
import { updateCandidateMemory } from '@/lib/memory'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, role, round_summaries, candidateId, resumeText } = body

    const model = getModel(false)

    const summariesText = round_summaries && round_summaries.length > 0
      ? JSON.stringify(round_summaries, null, 2)
      : "No rounds were completed."

    const prompt = `
You are the Final Hiring Committee at ${company} for the ${role} position.
You have been provided with summaries of all interview rounds conducted so far.

Round Summaries:
${summariesText}

Your task is to provide a final decision (SELECTED or NOT SELECTED) and a comprehensive breakdown.

CRITICAL RULES:
1. If the candidate failed any round (should_proceed is false or verdict is FAIL), you MUST return NOT SELECTED.
2. If round_summaries is empty, the candidate quit early. Decision: NOT SELECTED.
3. Provide an overall score (1-10) based on the performance across all rounds.
4. Be honest and strict. If performance was mediocre, NOT SELECTED is the appropriate decision.

Return ONLY this JSON. No markdown. No explanation:
{
  "decision": "SELECTED" | "NOT SELECTED",
  "overall_score": 0-10,
  "headline": "A short, punchy headline about the decision",
  "strengths": ["list of 2-3 key strengths"],
  "weaknesses": ["list of 2-3 areas that need work"],
  "detailed_feedback": "A 2-3 sentence summary of why this decision was made.",
  "what_to_improve_for_next_time": ["Specific advice for the candidate"]
}`

    const result = await model.generateContent(prompt)
    const rawText = result.response.text()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()

    const data = JSON.parse(rawText);

    // Save to memory
    if (candidateId) {
        await updateCandidateMemory(candidateId, data.strengths, data.weaknesses, resumeText);
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('=== FINAL VERDICT API ERROR ===', error?.message)
    return NextResponse.json({ 
        success: false, 
        data: {
            decision: 'NOT SELECTED',
            headline: 'Interview Evaluation Incomplete',
            overall_score: 0,
            strengths: ['N/A'],
            weaknesses: ['Interview ended prematurely or system error'],
            detailed_feedback: 'We could not generate a full verdict due to insufficient data or a connection issue.',
            what_to_improve_for_next_time: ['Try to complete all interview rounds.']
        }
    })
  }
}
