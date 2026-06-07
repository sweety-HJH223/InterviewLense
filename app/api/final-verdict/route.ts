import { NextRequest, NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'
import { updateCandidateMemory } from '@/lib/memory'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, role, round_summaries, candidateId } = body

    // ... (model and prompt logic remains)

    const result = await model.generateContent(prompt)
    const rawText = result.response.text()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()

    const data = JSON.parse(rawText);

    // Save to memory
    if (candidateId) {
        await updateCandidateMemory(candidateId, data.strengths, data.weaknesses);
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    // ... (unchanged)
  }
}
