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
    return null;
  }
}

const saveCache = async (company: string, role: string, data: any) => {
  try {
    const docRef = doc(db, 'researchCache', `${company.toLowerCase()}-${role.toLowerCase()}`);
    await setDoc(docRef, data);
  } catch (e) {}
}

export async function POST(req: NextRequest) {
  try {
    const { company, role } = await req.json()

    // 1. Check Cache
    const cached = await getCachedResearch(company, role);
    if (cached) return NextResponse.json({ success: true, data: cached });

    // 2. Direct AI Call
    const model = getModel(false) 
    const prompt = `Research company '${company}' for role '${role}'. 
    Return JSON only:
    {
      "company": "${company}",
      "role": "${role}",
      "hiring_focus": "1 sentence",
      "interview_rounds": ["round1", "round2"],
      "what_they_reward": ["reward1", "reward2"],
      "what_gets_rejected": ["reject1", "reject2"],
      "first_question": "first question"
    }`

    const result = await model.generateContent(prompt)
    const rawText = result.response.text().replace(/```json|```/g, '').trim()
    
    let data;
    try {
        data = JSON.parse(rawText)
    } catch (e) {
        console.error('=== JSON PARSE ERROR ===', rawText);
        throw new Error("Failed to parse AI response.");
    }
    
    await saveCache(company, role, data);
    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('=== RESEARCH API FAILED ===', error);
    return NextResponse.json({ 
        success: false, 
        error: `Research failed: ${error.message}` 
    });
  }
}
