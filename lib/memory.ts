import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './firebase';

export interface CandidateMemory {
  candidateId: string;
  totalInterviews: number;
  cumulativeStrengths: string[];
  cumulativeWeaknesses: string[];
  resumeText?: string;
}

export const getCandidateMemory = async (candidateId: string): Promise<CandidateMemory | null> => {
  const docRef = doc(db, 'candidateMemory', candidateId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data() as CandidateMemory;
  return null;
};

export const updateCandidateMemory = async (candidateId: string, strengths: string[], weaknesses: string[], resumeText?: string) => {
  const docRef = doc(db, 'candidateMemory', candidateId);
  const docSnap = await getDoc(docRef);

  const updates: any = {
    totalInterviews: (docSnap.exists() ? (docSnap.data()?.totalInterviews || 0) : 0) + 1,
    cumulativeStrengths: arrayUnion(...strengths),
    cumulativeWeaknesses: arrayUnion(...weaknesses)
  };

  if (resumeText) {
    updates.resumeText = resumeText;
  }

  if (docSnap.exists()) {
    await updateDoc(docRef, updates);
  } else {
    await setDoc(docRef, {
      candidateId,
      ...updates,
      totalInterviews: 1
    });
  }
};
