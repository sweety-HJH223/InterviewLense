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
    const model = getModel(false)

    const prompt = `
You are a career research assistant with knowledge of thousands of companies worldwide.

Research the company '${company}' and the role '${role}'.

IMPORTANT: 
- If '${company}' is a real, known company (startup, corporation, tech company, etc.) return full data
- If '${company}' is clearly fake, nonsensical, or unknown, return isValid: false
- Gemini knows most real companies — use your training knowledge

If NOT a real company, return ONLY:
{ "isValid": false }

If IS a real company, return ONLY this JSON:
{
  "isValid": true,
  "company": "${company}",
  "role": "${role}",
  "website": "official website URL",
  "logo_url": "",
  "hiring_focus": "what this company mainly hires for",
  "interview_rounds": ["round 1", "round 2", "round 3"],
  "what_they_reward": ["trait 1", "trait 2", "trait 3"],
  "what_gets_rejected": ["reason 1", "reason 2"],
  "cultural_notes": "2-3 sentences about their interview culture and what makes candidates stand out",
  "recent_questions": ["question 1", "question 2", "question 3"],
  "first_question": "one specific opening interview question for ${role} at ${company}"
}

Return ONLY valid JSON. No markdown. No explanation.`

    const result = await model.generateContent(prompt)
    const rawText = result.response.text()
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      throw new Error(`Failed to parse AI response.`);
    }

    // 3. Save to Cache
    saveCache(company, role, data);

    if (!data.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: `"${company}" doesn't appear to be a recognized company. Please check the name and try again.` 
      });
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('=== RESEARCH API ERROR ===', error?.message)
    return NextResponse.json({
      success: false,
      error: `Something went wrong. Please try again.`
    })
  }
}