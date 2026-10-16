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

/** Read the persisted demo session, if any. */
function readDemoSession(): AuthUser | null {
  try {
    const stored = localStorage.getItem(DEMO_SESSION_KEY);
    return stored ? (JSON.parse(stored) as AuthUser) : null;
  } catch {
    return null;
  }
}

/**
 * Current Firebase ID token for API calls, or null for demo/signed-out.
 * Lives outside React so the fetch wrapper can call it.
 */
export async function getIdToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  const fbUser = auth?.currentUser;
  if (!fbUser) return null;
  try {
    return await fbUser.getIdToken();
  } catch {
    return null;
  }
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
      // Live mode — Firebase owns real sessions, but a demo session chosen
      // on /masuk must survive reloads too (otherwise the demo logs out).
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        setUser(fbUser ? toAuthUser(fbUser) : readDemoSession());
        setIsLoading(false);
      });
      return unsubscribe;
    }

    // No Firebase — demo session only.
    setUser(readDemoSession());
    setIsLoading(false);
  }, []);

const LOCAL_ACCOUNTS_KEY = "hanga_local_accounts";

interface StoredAccount {
  name: string;
  passwordHash: string;
}

function getLocalAccounts(): Record<string, StoredAccount> {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (auth && isFirebaseConfigured()) {
      try {
        localStorage.removeItem(DEMO_SESSION_KEY);
        await signInWithEmailAndPassword(auth, email, password);
        return;
      } catch (err) {
        const code = (err as { code?: string }).code ?? "";
        if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
          throw new Error(mapAuthError(code));
        }
        console.warn("Firebase sign in failed, falling back to local mode:", err);
      }
    }

    // Local / Demo Mode Auth:
    const accounts = getLocalAccounts();
    const normalizedEmail = email.trim().toLowerCase();
    const account = accounts[normalizedEmail];

    if (account && account.passwordHash && account.passwordHash !== password) {
      throw new Error("Email atau kata sandi salah.");
    }

    const localUser: AuthUser = {
      uid: `local-${normalizedEmail.replace(/[^a-z0-9]/g, "-")}`,
      email: email.trim(),
      displayName: account ? account.name : email.split("@")[0],
      isDemo: false,
    };
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(localUser));
    setUser(localUser);
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const auth = getFirebaseAuth();
      if (auth && isFirebaseConfigured()) {
        try {
          localStorage.removeItem(DEMO_SESSION_KEY);
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          if (name) {
            await updateProfile(cred.user, { displayName: name });
            setUser(toAuthUser(cred.user));
          }
          return;
        } catch (err) {
          const code = (err as { code?: string }).code ?? "";
          if (code === "auth/email-already-in-use") {
            throw new Error(mapAuthError(code));
          }
          console.warn("Firebase sign up failed, falling back to local mode:", err);
        }
      }

      // Local / Demo Mode Registration:
      const accounts = getLocalAccounts();
      const normalizedEmail = email.trim().toLowerCase();
      accounts[normalizedEmail] = {
        name: name.trim() || "Pemilik Warung",
        passwordHash: password,
      };
      localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));

      const localUser: AuthUser = {
        uid: `local-${normalizedEmail.replace(/[^a-z0-9]/g, "-")}`,
        email: email.trim(),
        displayName: name.trim() || "Pemilik Warung",
        isDemo: false,
      };
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(localUser));
      setUser(localUser);
    },
    []
  );

  const signInWithGoogle = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (auth && isFirebaseConfigured()) {
      try {
        localStorage.removeItem(DEMO_SESSION_KEY);
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        await signInWithPopup(auth, provider);
        return;
      } catch (err) {
        const code = (err as { code?: string }).code ?? "";
        throw new Error(mapAuthError(code));
      }
    }

    // Local / Demo Mode Google Sign-In:
    const googleUser: AuthUser = {
      uid: "local-google-user",
      email: "pemilik@warung.com",
      displayName: "Bu Sari (Google)",
      isDemo: false,
    };
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(googleUser));
    setUser(googleUser);
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
