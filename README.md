# InterviewLens 🎯

> AI that researches how your target company actually interviews — then simulates it.

**Live demo:** [interview-lense.vercel.app](https://interview-lense.vercel.app)
**Repo:** [github.com/sweety-HJH223/InterviewLense](https://github.com/sweety-HJH223/InterviewLense)

---

## What It Does

Most interview prep tools throw generic questions at you. InterviewLens instead researches how your **specific target company** actually interviews — based on real candidate experiences — and then simulates that exact interview style, with feedback tuned to that company's culture and evaluation criteria.

Sign in with Google, enter a target company (and role), and InterviewLens builds a research profile for that company before the interview even starts.

## How It Works

InterviewLens runs a 3-agent AI pipeline powered by Google Gemini:

- **Agent A — Researcher**
  Analyzes the target company and role. Extracts typical interview rounds, what interviewers reward, common reasons candidates get rejected, and generates a company-specific opening question.

- **Agent B — Interviewer**
  Roleplays as a real interviewer from that company. Asks follow-up questions that match the company's actual interview style and culture, and stays in character for the full session.

- **Agent C — Evaluator**
  Scores every answer against that company's specific criteria. Returns a score, strengths, areas to improve, an example of a stronger answer, and a culture-specific tip.

You can watch all three agents communicate in real time on the `/logs` page.

## Features

- 🔍 Company-specific interview research and simulation (not generic question banks)
- 🤖 3-agent AI orchestration pipeline (Research → Interview → Evaluate)
- 🔐 Google Sign-In authentication
- 📊 Real-time answer evaluation with scores and improvement tips
- 💡 Culture-specific tips per company
- 🏢 Works for any company, not a fixed list
- 💾 Interview sessions saved to Firestore for later review
- 📋 Live agent pipeline log viewer (`/logs`)

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, lucide-react |
| AI | Google Gemini (via `@google/genai`) — 3-agent pipeline |
| Auth | Firebase Authentication (Google Sign-In) |
| Database | Firebase Firestore (interview sessions, agent logs) |
| Hosting | Vercel |
| Analytics | Vercel Analytics |
| Language | TypeScript |

> Note: the repo includes `firebase.json` / `.firebaserc` because Firebase powers **Auth and Firestore**, but the app itself is deployed on **Vercel**, not Firebase Hosting.

## Getting Started

```bash
git clone https://github.com/sweety-HJH223/InterviewLense.git
cd InterviewLense
npm install
```

Create a `.env.local` file in the project root with:

```
# Gemini
GEMINI_API_KEY=your_gemini_api_key

# Firebase (Auth + Firestore)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Agent Pipeline Logs

Visit `/logs` to watch all three agents (Researcher, Interviewer, Evaluator) communicate in real time during a session.

## Project Structure

```
InterviewLense/
├── app/          # Next.js App Router pages & API routes
├── components/   # UI components (shadcn/ui based)
├── lib/          # Agent logic, Firebase config, Gemini client, utilities
├── public/        # Static assets
└── out/          # Static export output
```

## Built For

Google Gen AI Academy APAC 2026 — Meet the Builders Campaign

## Author

Built by **SweetyCodes (Subhashree Behera)**
[Portfolio](https://sweetycodes-jh.vercel.app) · [GitHub](https://github.com/sweety-HJH223)
