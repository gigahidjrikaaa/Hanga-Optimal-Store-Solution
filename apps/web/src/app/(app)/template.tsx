/**
 * (app) route-group template — re-mounts on every navigation, giving each
 * screen a consistent 260ms rise-in entry (globals.css §9).
 */

export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
