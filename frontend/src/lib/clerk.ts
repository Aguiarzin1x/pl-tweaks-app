import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";

let tokenGetter: (() => Promise<string | null>) | null = null;
export function setClerkTokenGetter(getter: (() => Promise<string | null>) | null) {
  tokenGetter = getter;
}
export async function getClerkToken(): Promise<string | null> {
  if (!tokenGetter) return null;
  let timer: number | undefined;
  try {
    return await Promise.race([
      tokenGetter(),
      new Promise<null>((resolve) => {
        timer = window.setTimeout(() => {
          console.warn("[PL TWEAKS] Clerk getToken excedeu 8s; a sessão pode estar indisponível neste domínio.");
          resolve(null);
        }, 8000);
      }),
    ]);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
  }
}
export function ClerkTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setClerkTokenGetter(() => getToken());
    return () => setClerkTokenGetter(null);
  }, [getToken]);
  return null;
}
const publicEnv = import.meta.env as Record<string, string | undefined>;
export const clerkPublishableKey = (publicEnv.VITE_CLERK_PUBLISHABLE_KEY || "").trim();
export const clerkConfigured = clerkPublishableKey.startsWith("pk_");
