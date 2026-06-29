# InterviewLens 🎯

> AI researches how your target company actually interviews — then simulates it.

## What It Does

Most interview prep tools give you generic questions. InterviewLens researches how your specific target company actually interviews based on real candidate experiences — then simulates that exact interview style with culturally aware feedback.

## How It Works

InterviewLens uses a 3-agent AI pipeline powered by Google Gemini:

**Agent A — Researcher**
Analyzes the target company and role. Extracts interview rounds, what they reward, what gets candidates rejected, and generates a company-specific opening question.

**Agent B — Interviewer**
Acts as a real interviewer from that company. Asks follow-up questions based on the company's actual interview style and culture. Stays in character throughout the session.

**Agent C — Evaluator**
Evaluates every answer against that specific company's criteria. Returns a score, strengths, improvements, a better answer example, and a cultural tip specific to the company.

## Tech Stack

| Tool | Purpose |
|------|---------|
| Google Gemini 2.5 Flash | All 3 AI agents |
| Firebase Firestore | Save interview sessions |
| Firebase Hosting | Deployment |
| Next.js 15 | Frontend + API routes |
| Tailwind CSS | Styling |

## Features

- 🔍 Company-specific interview simulation
- 🤖 3-agent AI orchestration pipeline
- 📊 Real-time answer evaluation with scores
- 💡 Cultural tips per company
- 🏢 Works for any company worldwide
- 💾 Save and review past sessions
- 📋 Agent pipeline logs viewer

## Live link : https://interview-lense.vercel.app/

## Getting Started

```bash
git clone https://github.com/sweety-HJH223/interviewlens
cd interviewlens
npm install
```

Create `.env.local`:
GEMINI_API_KEY=your_gemini_api_key

Run:
```bash
npm run dev
```

Open `http://localhost:3000`

## Agent Pipeline

Visit `/logs` to see all 3 agents communicating in real time.

## Built For

Google Gen AI Academy APAC 2026 — Meet the Builders Campaign
  by Subhashree Behera

## 👩‍💻 Built By
**SweetyCodes** — [sweetycodes-jh.vercel.app](https://sweetycodes-jh.vercel.app/)
