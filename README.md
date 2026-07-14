# InterviewLens 🎯

An AI-powered interview simulator that conducts realistic, company-specific mock interviews using a 5-agent orchestration pipeline. Built for Google Gen AI Academy APAC 2026.

**Live app:** [interview-lense.vercel.app](https://interview-lense.vercel.app/)

---

## Overview

InterviewLens simulates a real hiring process end-to-end — researching how a specific company actually evaluates candidates, conducting a multi-round interview tailored to that company's culture, scoring every answer in real-time, and issuing a final hire/no-hire verdict with detailed feedback. Unlike generic mock-interview tools that ask the same questions regardless of company, InterviewLens dynamically adapts every question and evaluation criterion to the target company and role.

It also remembers candidates across sessions — a returning user's interview history (strengths, weaknesses, total interviews) is factored into future evaluations, so feedback compounds and personalizes over time instead of resetting to zero every session.

---

## Key Features

- **5-agent AI pipeline** — Research, Interviewer, Evaluator, Round Summary, and Final Verdict agents, each with a narrow, focused responsibility
- **Company-specific personalization** — interview questions and scoring criteria adapt to what a specific company actually rewards and rejects
- **Real-time answer evaluation** — every answer is scored against a strict, rule-based rubric (not just a vague "rate this 1-10")
- **Persistent candidate memory** — strengths and weaknesses accumulate across interviews via Firestore, so returning candidates get increasingly personalized evaluation
- **Resume-aware interviews** — upload a PDF resume; Gemini's multimodal input reads it directly and tailors both questions and scoring to the candidate's actual background
- **Google Sign-In authentication** — sessions are tied to a real user account
- **Session history** — past interviews are saved and viewable via a dedicated sessions page
- **Research caching** — company/role research is cached in Firestore to avoid redundant AI calls for repeat lookups
- **Resilient error handling** — exponential backoff retry logic on rate limits/overload, graceful fallbacks at every layer (API route → frontend), so failures never crash the user's session
- **Agent call logging** — every agent's input/output is logged for debugging and traceability

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, React, Tailwind CSS |
| AI | Google Gemini (gemini-flash-lite-latest) |
| Auth & Database | Firebase Authentication (Google Sign-In), Firebase Firestore |
| Deployment | Vercel |

---

## Architecture: The 5-Agent Pipeline

```
User Input (company, role, optional resume)
        │
        ▼
┌───────────────────┐
│  1. RESEARCH AGENT │  Runs once. Researches the company's hiring
│    (/api/research) │  focus, interview rounds, what's rewarded/
└───────────────────┘  rejected. Cached in Firestore to avoid
        │               redundant calls for repeat company/role pairs.
        ▼
   [Interview begins]
        │
   ┌────┴─────────────────────────┐
   ▼                              ▼
┌───────────────────┐   ┌───────────────────┐
│ 2. INTERVIEWER      │   │ 3. EVALUATOR       │
│  (/api/interview)   │   │  (/api/evaluate)   │
│  Asks next question,│   │  Scores each answer │
│  using full          │   │  against a strict   │
│  conversation history│   │  rubric + candidate │
│  + company context   │   │  memory + resume    │
└───────────────────┘   └───────────────────┘
        │  (repeats per answer, runs in parallel)
        ▼  (every 4 answers)
┌───────────────────┐
│ 4. ROUND SUMMARY    │  Aggregates a full round into one verdict:
│ (/api/round-summary)│  STRONG PASS / PASS / BORDERLINE / FAIL
└───────────────────┘
        │  (after all rounds complete)
        ▼
┌───────────────────┐
│ 5. FINAL VERDICT     │  Aggregates all round summaries into a final
│ (/api/final-verdict) │  SELECTED / NOT SELECTED decision. Writes
└───────────────────┘  results back into candidate memory (Firestore).
        │
        ▼
   Save full session to Firestore (/api/save-session)
```

### Why 5 separate agents instead of one?

Each agent has a narrow, well-defined job with its own tailored prompt and rubric. This keeps prompts focused and easier to tune independently — the Evaluator's strict scoring rules would conflict with the Interviewer's job of asking natural, conversational follow-ups if combined into a single prompt. It also makes debugging significantly easier: every agent's input and output is logged separately, so a bad output can be traced back to the exact stage that produced it.

---

## Candidate Memory System

Memory is a **read-then-write loop** stored in Firestore's `candidateMemory` collection (one document per candidate ID):

- **Read** — at the start of every answer evaluation, the Evaluator agent pulls the candidate's accumulated strengths, weaknesses, and total interview count, and feeds it into the scoring prompt for personalized evaluation from question one.
- **Write** — at the end of a full session, the Final Verdict agent appends that session's strengths/weaknesses onto the candidate's running lists using Firestore's `arrayUnion` (so nothing is overwritten — memory compounds over time).

---

## Reliability & Error Handling

Failures are handled in layers so the user experience never breaks:

1. **API call layer** — automatic retry with exponential backoff (1s → 2s → 4s) on 503 (overloaded) or 429 (rate limited) responses
2. **Route layer** — every API route catches AI/parsing failures and returns a clean `{ success: false }` response instead of crashing
3. **Frontend layer** — graceful fallback messages if a question or evaluation fails to generate, and a complete fallback verdict screen if the final decision can't be generated — the user is never left with a broken UI

---

## Multimodal Resume Parsing

Uploaded PDF resumes are converted to base64 and sent to Gemini as multimodal input — combining a text instruction with `inlineData` containing the raw PDF bytes. Gemini reads the PDF directly and extracts clean resume text, which then personalizes both the Interviewer's questions and the Evaluator's scoring.

---

## Known Limitations & Roadmap

- Research currently relies on Gemini's training knowledge rather than live web search — a `useSearch` flag is reserved in the codebase for wiring up Google Search grounding in a future update, to ground company research in current, verifiable information
- Voice-based interview practice (rather than typed answers) is planned, to better simulate the experience of a real spoken interview
- Evaluation accuracy has not yet been benchmarked against human-graded interview answers — a planned next step is comparing Evaluator scores against real interviewer judgments to validate and refine the scoring rubric

---

## Getting Started

```bash
npm install
```

Create a `.env.local` file with:
```
GEMINI_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_API_KEY=your_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Run the development server:
```bash
npm run dev
```

---

## Author

Built by SweetyCodes(Subhashree Behera)
