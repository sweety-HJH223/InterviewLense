import { NextRequest, NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

const getCachedResearch = async (company: string, role: string) => {
  try {
    const docRef = doc(db, 'researchCache', `${company.toLowerCase()}-${role.toLowerCase()}`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  } catch (e) {
    console.error('Cache fetch error', e);
    return null;
  }
}

const saveCache = async (company: string, role: string, data: any) => {
  try {
    const docRef = doc(db, 'researchCache', `${company.toLowerCase()}-${role.toLowerCase()}`);
    await setDoc(docRef, data);
  } catch (e) {
    console.error('Cache save error', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, role } = body

    // 1. Check Cache First
    const cached = await getCachedResearch(company, role);
    if (cached) {
      if (!cached.isValid) {
        return NextResponse.json({ success: false, error: "Company/Role not found" });
      }
      return NextResponse.json({ success: true, data: cached });
    }

    // 2. If not cached, call API
    let data;
    try {
      const model = getModel(false)

      const prompt = `
      You are a career research assistant with knowledge of thousands of companies worldwide.
      Research the company '${company}' and the role '${role}'.
      Return ONLY this JSON:
      {
      "isValid": true,
      "company": "${company}",
      "role": "${role}",
      "website": "official website URL",
      "logo_url": "",
      "hiring_focus": "what this company mainly hires for",
      "interview_rounds": ["round 1", "round 2", "round 3"],
      "what_they_reward": [
        {"title": "reward name", "whyValued": "one sentence why this company specifically values this", "howToShow": "one specific actionable tip to demonstrate this in interview", "examplePhrase": "an actual phrase candidate can say in interview"}
      ],
      "what_gets_rejected": [
        {"title": "reason name", "whatItLooksLike": "specific behavior that triggers this rejection", "howToAvoid": "one specific action to avoid this rejection", "neverSay": "exact phrase candidate should never say"}
      ],
      "cultural_notes": "2-3 sentences about their interview culture",
      "recent_questions": ["question 1"],
      "first_question": "first question",
      "hiring_process": "process description",
      "how_to_prepare": ["prep tip"],
      "what_to_study": ["topic"],
      "insider_tips": ["tip"],
      "timeline": "time"
      }
      Return ONLY valid JSON. No markdown. No explanation.`

      const result = await model.generateContent(prompt)
      const rawText = result.response.text()
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim()

      data = JSON.parse(rawText);
      await saveCache(company, role, data);
    } catch (apiError: any) {
        console.error('=== RESEARCH API FAILED ===', apiError);
        if (apiError.message?.includes('429')) {
             return NextResponse.json({ 
                success: false, 
                error: "API quota exceeded. Please try again in a few minutes, or use a pre-cached company (like Google)." 
            });
        }
        throw apiError;
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('=== RESEARCH API ERROR ===', error)
    return NextResponse.json({
      success: false,
      error: `Error: ${error.message || 'Something went wrong.'}`
    })
  }
}