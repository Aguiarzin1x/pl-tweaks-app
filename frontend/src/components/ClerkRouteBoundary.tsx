import { useAuth } from "@clerk/clerk-react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

export default function ClerkRouteBoundary({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);
  const isProtected = location.pathname.startsWith("/app") || location.pathname.startsWith("/admin");
  const isAuthPage = location.pathname === "/" || location.pathname.startsWith("/login");

  useEffect(() => {
    if (isLoaded || !isProtected) {
      setTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setTimedOut(true);
      console.warn("[PL TWEAKS] Clerk permaneceu carregando por mais de 10s. Verifique VITE_CLERK_PUBLISHABLE_KEY, o domínio autorizado e as configurações de Clerk na Vercel.");
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [isLoaded, isProtected]);

  if (!isLoaded && isProtected) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-sm text-muted-foreground">
        {timedOut ? (
          <div className="max-w-lg space-y-3 rounded-xl border border-amber-500/40 bg-amber-950/30 p-6">
            <p className="font-semibold text-amber-200">Não foi possível concluir a inicialização do Clerk.</p>
            <p>Verifique no console do navegador se a chave pública está presente e se este domínio da Vercel foi adicionado aos domínios autorizados do Clerk.</p>
            <button type="button" className="rounded-md border border-border px-3 py-2 hover:bg-muted" onClick={() => window.location.reload()}>Tentar novamente</button>
          </div>
        ) : "Verificando sessão…"}
      </div>
    );
  }
  if (isLoaded && !isSignedIn && isProtected) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (isLoaded && isSignedIn && isAuthPage) {
    return <Navigate to="/app" replace />;
  }
  return <>{children}</>;
}
