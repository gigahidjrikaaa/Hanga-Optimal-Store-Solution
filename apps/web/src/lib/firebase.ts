/**
 * Hanga — Firebase client (lazy, optional).
 *
 * Firebase Auth powers live sign-in. When the NEXT_PUBLIC_FIREBASE_* env vars
 * are not set (local dev, seeded demo, CI), every helper returns null and the
 * app falls back to the demo session in auth-context.tsx — the demo never
 * depends on a live Firebase project.
 */

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
  );
}

/** Initialized Auth instance, or null when Firebase is not configured. */
export function getFirebaseAuth(): Auth | null {
  if (!isFirebaseConfigured()) return null;
  const app: FirebaseApp = getApps().length
    ? getApp()
    : initializeApp(firebaseConfig);
  return getAuth(app);
}
