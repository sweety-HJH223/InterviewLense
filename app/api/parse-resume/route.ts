import { NextRequest, NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ success: false, error: 'No file uploaded.' })

    // Convert file to base64
    const buffer = await file.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const model = getModel(false) // Use basic model

    const prompt = "Please extract the full text from this resume PDF. Return ONLY the text, cleaned up for readability. If there are multiple pages, include all of them. Do not add any introduction or notes."

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: "application/pdf"
        }
      }
    ])

    const text = result.response.text().trim()

    return NextResponse.json({ success: true, text })

  } catch (error: any) {
    console.error('=== PDF PARSE ERROR ===', error?.message)
    return NextResponse.json({ 
      success: false, 
      error: "Failed to read PDF. Please try pasting the text manually." 
    })
  }
}
