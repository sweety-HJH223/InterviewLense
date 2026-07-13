"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User as FirebaseUser } from "firebase/auth";

interface RoundSummary {
  round_name: string;
  overall_score: number;
  verdict: string;
}

interface FinalVerdict {
  decision: string;
  overall_score: number;
  headline: string;
  strengths: string[];
  weaknesses: string[];
  detailed_feedback: string;
}

interface Message {
  id: string;
  type: "user" | "interviewer";
  content: string;
}

interface Session {
  id: string;
  company: string;
  role: string;
  timestamp: string;
  messageCount: number;
  messages: Message[];
  agentLogs: RoundSummary[];
  finalVerdict?: FinalVerdict;
}

export default function SessionsPage() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Session | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/sessions?userId=${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        setSessions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  const handleSignIn = async () => {
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const decisionColor = (decision?: string) =>
    decision === "SELECTED" ? "text-emerald-400" : decision ? "text-red-400" : "text-gray-500";

  if (!authChecked) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-300">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-gray-100">
      <Link href="/" className="mb-4 inline-block text-blue-400 hover:text-blue-300">&larr; Back to Home</Link>
      <h1 className="mb-6 text-3xl font-bold">Past Interview Sessions</h1>

      {!user ? (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center max-w-md">
          <p className="mb-4 text-gray-400">Sign in to see your interview history.</p>
          <button onClick={handleSignIn} className="inline-flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-xl text-sm font-medium hover:bg-slate-100 transition">
            Sign in with Google
          </button>
        </div>
      ) : loading ? (
        <p>Loading sessions...</p>
      ) : sessions.length === 0 ? (
        <p className="text-gray-400">No interviews yet. Complete one to see it here.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="min-w-full divide-y divide-gray-800 text-sm">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-400">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-400">Company</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-400">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-400">Score</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-400">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 bg-gray-950">
              {sessions.map((session) => (
                <tr key={session.id} onClick={() => setSelected(session)} className="cursor-pointer hover:bg-gray-900 transition">
                  <td className="px-4 py-3 text-gray-300">
                    {session.timestamp ? new Date(session.timestamp).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td className="px-4 py-3 font-medium">{session.company}</td>
                  <td className="px-4 py-3 text-gray-400">{session.role}</td>
                  <td className="px-4 py-3">{session.finalVerdict?.overall_score ?? "—"}/10</td>
                  <td className={`px-4 py-3 font-semibold ${decisionColor(session.finalVerdict?.decision)}`}>
                    {session.finalVerdict?.decision ?? "Incomplete"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50" onClick={() => setSelected(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-800 bg-gray-900 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{selected.company} — {selected.role}</h2>
                <p className="text-sm text-gray-500">{selected.timestamp ? new Date(selected.timestamp).toLocaleString() : ""}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-200">✕</button>
            </div>

            {selected.finalVerdict && (
              <div className="mb-6 rounded-lg border border-gray-800 bg-gray-950 p-4">
                <p className={`font-semibold ${decisionColor(selected.finalVerdict.decision)}`}>
                  {selected.finalVerdict.decision} — {selected.finalVerdict.overall_score}/10
                </p>
                <p className="mt-1 text-sm text-gray-300">{selected.finalVerdict.headline}</p>
                <p className="mt-2 text-sm text-gray-400">{selected.finalVerdict.detailed_feedback}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-emerald-400">Strengths</p>
                    <ul className="mt-1 list-disc pl-4 text-sm text-gray-300">
                      {selected.finalVerdict.strengths?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-red-400">Weaknesses</p>
                    <ul className="mt-1 list-disc pl-4 text-sm text-gray-300">
                      {selected.finalVerdict.weaknesses?.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {selected.agentLogs?.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold text-gray-300">Round-by-round</h3>
                <div className="space-y-2">
                  {selected.agentLogs.map((round, i) => (
                    <div key={i} className="rounded-lg border border-gray-800 bg-gray-950 p-3 text-sm">
                      {round.round_name} — {round.overall_score}/10 ({round.verdict})
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-sm font-semibold text-gray-300">Transcript ({selected.messageCount} messages)</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selected.messages?.map((m) => (
                  <div key={m.id} className={`rounded-lg p-2 text-sm ${m.type === "user" ? "bg-indigo-950/40 text-indigo-100" : "bg-gray-800 text-gray-300"}`}>
                    <span className="font-semibold">{m.type === "user" ? "You" : "Interviewer"}:</span> {m.content}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}