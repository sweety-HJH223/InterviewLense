import { NextRequest, NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, role, messages, round_number } = body

    const model = getModel(false)

    const prompt = `
You are an expert interviewer evaluating a candidate for the ${role} position at ${company}.
The candidate has just completed Round ${round_number}.

Here are the messages from this round:
${JSON.stringify(messages)}

Evaluate the candidate's performance in this round.
Return ONLY this JSON:
{
  "round_name": "Name of this round",
  "overall_score": 1-10,
  "verdict": "STRONG PASS" | "PASS" | "BORDERLINE" | "FAIL",
  "what_went_well": ["point 1", "point 2"],
  "areas_to_improve": ["point 1", "point 2"],
  "should_proceed": boolean,
  "next_round_name": "Name of next round or null",
  "encouragement": "Encouraging sentence"
}
Return ONLY valid JSON. No markdown. No explanation.`

    const result = await model.generateContent(prompt)
    const rawText = result.response.text()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()

    const data = JSON.parse(rawText);
    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('=== ROUND SUMMARY API ERROR ===', error?.message)
    return NextResponse.json({ success: false, error: 'Failed to analyze round.' })
  }
}
