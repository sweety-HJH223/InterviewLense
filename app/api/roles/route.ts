import { NextRequest, NextResponse } from 'next/server'
import { getModel } from '@/lib/gemini'
import fs from 'fs'
import path from 'path'

const CACHE_PATH = path.join(process.cwd(), 'roles-cache.json');

const getCachedRoles = (company: string) => {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
      return cache[company.toLowerCase()] || null;
    }
  } catch {}
  return null;
}

const saveCache = (company: string, roles: string[]) => {
  let cache: any = {};
  try {
    if (fs.existsSync(CACHE_PATH)) cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
  } catch {}
  cache[company.toLowerCase()] = roles;
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

// Fallback roles for common tech companies
const ROLE_FALLBACKS: Record<string, string[]> = {
  'google': ['Software Engineer', 'Backend Engineer', 'Frontend Engineer', 'Product Manager', 'Data Scientist'],
  'amazon': ['SDE I', 'SDE II', 'Solutions Architect', 'Data Engineer', 'Product Manager'],
  'meta': ['Software Engineer', 'Frontend Engineer', 'Backend Engineer', 'Data Scientist', 'Product Manager']
}

export async function POST(req: NextRequest) {
  try {
    const { company } = await req.json()
    const companyLower = company.toLowerCase()

    // 1. Check Cache
    const cached = getCachedRoles(companyLower);
    if (cached) return NextResponse.json({ success: true, roles: cached });

    // 2. Try API (with fallback)
    try {
        const model = getModel(false)
        const prompt = `Return a list of common job roles for the company '${company}'. Return ONLY a JSON array of strings: ["Role 1", "Role 2", ...].`
        const result = await model.generateContent(prompt)
        const rawText = result.response.text().replace(/```json|```/g, '').trim()
        const data = JSON.parse(rawText)
        
        saveCache(companyLower, data);
        return NextResponse.json({ success: true, roles: data })
    } catch (e) {
        console.warn('API failed, using fallback for', companyLower);
        const fallback = ROLE_FALLBACKS[companyLower] || ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer'];
        return NextResponse.json({ success: true, roles: fallback })
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: "Failed to fetch roles" })
  }
}
