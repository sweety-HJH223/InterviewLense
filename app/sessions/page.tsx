"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Session {
  id: string;
  company: string;
  role: string;
  timestamp: string;
  messageCount: number;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sessions")
      .then((res) => res.json())
      .then((data) => {
        setSessions(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-gray-100">
      <Link href="/" className="mb-4 inline-block text-blue-400 hover:text-blue-300">
        &larr; Back to Home
      </Link>
      <h1 className="mb-8 text-3xl font-bold">Past Interview Sessions</h1>
      {loading ? (
        <p>Loading sessions...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-lg border border-gray-800 bg-gray-900 p-6">
              <h2 className="text-xl font-semibold">{session.company}</h2>
              <p className="text-gray-400">{session.role}</p>
              <div className="mt-4 text-sm text-gray-500">
                <p>Date: {new Date(session.timestamp).toLocaleDateString()}</p>
                <p>Messages: {session.messageCount}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
