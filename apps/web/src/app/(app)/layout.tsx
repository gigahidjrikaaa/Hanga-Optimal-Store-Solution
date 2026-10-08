/**
 * (app) route group layout — every screen in here requires a signed-in owner.
 *
 * Routes are unchanged ((app) is invisible in URLs); this just draws the auth
 * boundary in one place instead of per-page.
 */

import { ProtectedRoute } from "@/components/protected-route";

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
