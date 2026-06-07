import { NextRequest, NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, role, messages, round_number } = body

    const model = getModel(false)

    const conversation = Array.isArray(messages) 
      ? messages.map((m: any) => `${m.type === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`).join('\n')
      : JSON.stringify(messages)

    const prompt = `
You are a strict senior hiring manager at ${company} evaluating a ${role} candidate after Round ${round_number}.

Conversation from this round:
${conversation}

STRICT SCORING RUBRIC:
- 1-3: Vague, casual, no examples, single sentence answers, slang ("yeah", "umm", "I guess")
- 4-5: Generic answers, lacks specifics or metrics
- 6-7: Decent answers with some structure but missing depth  
- 8-9: Strong STAR-format answers with specific metrics and examples
- 10: Exceptional, perfectly tailored to ${company} culture

MANDATORY RULES:
- Short answers under 3 sentences MUST score below 5
- Answers with no metrics or specific numbers = maximum score of 6
- Casual language = score below 4
- Be HONEST and STRICT. Do not inflate scores to encourage.
- If candidate gave weak answers, verdict MUST be BORDERLINE or FAIL

Return ONLY this JSON. No markdown. No explanation:
{
  "round_name": "Round ${round_number}",
  "overall_score": <strict number 1-10>,
  "verdict": "STRONG PASS" | "PASS" | "BORDERLINE" | "FAIL",
  "what_went_well": ["specific point 1", "specific point 2"],
  "areas_to_improve": ["specific point 1", "specific point 2"],
  "should_proceed": <true or false>,
  "next_round_name": null,
  "encouragement": "one honest sentence"
}`

    const result = await model.generateContent(prompt)
    const rawText = result.response.text()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()

    const data = JSON.parse(rawText)
    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('=== ROUND SUMMARY API ERROR ===', error?.message)
    return NextResponse.json({ success: false, error: 'Failed to analyze round.' })
  }
}