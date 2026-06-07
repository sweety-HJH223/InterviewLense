import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAEa4toxF4Xn1tOgr7X0j91ZGLGxYXbrO8",
  authDomain: "interview-lens-cdea1.firebaseapp.com",
  projectId: "interview-lens-cdea1",
  storageBucket: "interview-lens-cdea1.firebasestorage.app",
  messagingSenderId: "911449728160",
  appId: "1:911449728160:web:0c1b9605a5a27749bc95c5",
  measurementId: "G-E75XRRF78G"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Analytics is client-side only
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export const db = getFirestore(app);
export { analytics };
