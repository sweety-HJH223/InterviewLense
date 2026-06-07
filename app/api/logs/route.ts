import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const logPath = path.join(process.cwd(), 'agent-logs.json')
    const logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'))
    return NextResponse.json({ logs })
  } catch {
    return NextResponse.json({ logs: [] })
  }
}