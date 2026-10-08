/**
 * ProtectedRoute — client-side guard for app routes.
 *
 * Firebase Auth sessions live in IndexedDB, which server middleware cannot
 * read, so route protection happens here: while auth state hydrates we hold
 * the full SplashScreen; once resolved it fades out (hold → fading → gone),
 * and signed-out visitors are redirected to /masuk with a `next` param.
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SplashScreen } from "@/components/splash-screen";

type SplashPhase = "hold" | "fading" | "gone";

const HOLD_MS = 250;
const FADE_MS = 400;

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<SplashPhase>("hold");

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(`/masuk?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  useEffect(() => {
    if (isLoading || !user) {
      setPhase("hold");
      return;
    }
    const fadeTimer = setTimeout(() => setPhase("fading"), HOLD_MS);
    const goneTimer = setTimeout(() => setPhase("gone"), HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, [isLoading, user]);

  if (isLoading) return <SplashScreen />;
  if (!user) return null;
  if (phase !== "gone") return <SplashScreen fading={phase === "fading"} />;

  return <>{children}</>;
}
