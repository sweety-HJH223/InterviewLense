import { NextRequest, NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'
import fs from 'fs'
import path from 'path'

const CACHE_PATH = path.join(process.cwd(), 'research-cache.json');

const getCachedResearch = (company: string, role: string) => {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
      return cache[`${company.toLowerCase()}-${role.toLowerCase()}`] || null;
    }
  } catch {}
  return null;
}

const saveCache = (company: string, role: string, data: any) => {
  let cache: any = {};
  try {
    if (fs.existsSync(CACHE_PATH)) cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  } catch {}
  cache[`${company.toLowerCase()}-${role.toLowerCase()}`] = data;
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company, role } = body

    // 1. Check Cache First
    const cached = getCachedResearch(company, role);
    if (cached) {
      if (!cached.isValid) {
        return NextResponse.json({ success: false, error: "Company/Role not found" });
      }
      return NextResponse.json({ success: true, data: cached });
    }

    // 2. If not cached, call API — NO search grounding
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
      saveCache(company, role, data);
    } catch (apiError: any) {
        console.error('=== RESEARCH API FAILED ===', apiError);
        // If quota exceeded, give a friendly message
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