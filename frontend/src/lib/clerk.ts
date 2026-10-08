import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";

let tokenGetter: (() => Promise<string | null>) | null = null;
export function setClerkTokenGetter(getter: (() => Promise<string | null>) | null) {
  tokenGetter = getter;
}
export async function getClerkToken(): Promise<string | null> {
  return tokenGetter ? tokenGetter() : null;
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
export const clerkPublishableKey = (
  publicEnv.VITE_CLERK_PUBLISHABLE_KEY ||
  publicEnv.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  ""
).trim();
export const clerkConfigured = clerkPublishableKey.startsWith("pk_");
