import { useAuth } from "@clerk/clerk-react";
import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

export default function ClerkRouteBoundary({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const isProtected = location.pathname.startsWith("/app") || location.pathname.startsWith("/admin");
  const isAuthPage = location.pathname === "/" || location.pathname === "/login";

  if (!isLoaded && isProtected) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">Verificando sessão…</div>;
  }
  if (isLoaded && !isSignedIn && isProtected) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (isLoaded && isSignedIn && isAuthPage) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}
