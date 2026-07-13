import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { company, role, messages, agentLogs, userId, finalVerdict } = body;

    const docRef = await addDoc(collection(db, 'interviews'), {
      userId,
      company,
      role,
      messages,
      agentLogs,
      finalVerdict: finalVerdict || null,
      messageCount: messages.length,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (error) {
    console.error('Error saving session:', error);
    return NextResponse.json({ error: 'Failed to save session' }, { status: 500 });
  }
}