/**
 * Hanga — Auth context.
 *
 * Identity for the PWA:
 * - Live: Firebase Auth (email/password + Google), session persisted by the SDK.
 * - Demo: a local "Bu Sari" session in localStorage, used when Firebase is not
 *   configured or when the owner taps "Mode Demo" — keeps the seeded demo
 *   one-tap and stage-safe.
 *
 * Error messages are user-facing and therefore Bahasa; they are deliberately
 * generic for credential failures (no user enumeration).
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase";

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isDemo: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInDemo: () => void;
  signOut: () => Promise<void>;
}

const DEMO_SESSION_KEY = "hanga_demo_session";

const DEMO_USER: AuthUser = {
  uid: "demo-bu-sari",
  email: null,
  displayName: "Bu Sari",
  isDemo: true,
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Map Firebase error codes to safe, plain-Bahasa messages. */
function mapAuthError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email atau kata sandi salah.";
    case "auth/email-already-in-use":
      return "Email sudah terdaftar. Silakan masuk.";
    case "auth/weak-password":
      return "Kata sandi terlalu pendek — gunakan minimal 8 karakter.";
    case "auth/invalid-email":
      return "Format email belum benar.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.";
    case "auth/network-request-failed":
      return "Jaringan bermasalah. Periksa koneksi internet.";
    case "auth/popup-closed-by-user":
      return "Jendela Google ditutup sebelum selesai.";
    default:
      return "Terjadi kendala. Silakan coba lagi.";
  }
}

function toAuthUser(fbUser: FirebaseUser): AuthUser {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    displayName: fbUser.displayName,
    isDemo: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();

    if (auth) {
      // Live mode — Firebase owns the session.
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        setUser(fbUser ? toAuthUser(fbUser) : null);
        setIsLoading(false);
      });
      return unsubscribe;
    }

    // Demo fallback — hydrate the local demo session if present.
    try {
      const stored = localStorage.getItem(DEMO_SESSION_KEY);
      setUser(stored ? (JSON.parse(stored) as AuthUser) : null);
    } catch {
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Mode demo aktif — gunakan tombol Mode Demo.");
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      throw new Error(mapAuthError(code));
    }
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error("Mode demo aktif — gunakan tombol Mode Demo.");
      }
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) {
          await updateProfile(cred.user, { displayName: name });
        }
      } catch (err) {
        const code = (err as { code?: string }).code ?? "";
        throw new Error(mapAuthError(code));
      }
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) {
      throw new Error("Mode demo aktif — gunakan tombol Mode Demo.");
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(auth, provider);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      throw new Error(mapAuthError(code));
    }
  }, []);

  const signInDemo = useCallback(() => {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(DEMO_USER));
    setUser(DEMO_USER);
  }, []);

  const signOut = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth && isFirebaseConfigured()) {
      await firebaseSignOut(auth);
    }
    localStorage.removeItem(DEMO_SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      signIn,
      signUp,
      signInWithGoogle,
      signInDemo,
      signOut,
    }),
    [user, isLoading, signIn, signUp, signInWithGoogle, signInDemo, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}
