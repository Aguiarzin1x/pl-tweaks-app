import { StrictMode } from 'react'
import { useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { queryClient } from './lib/queryClient'
import { ClerkProvider } from '@clerk/clerk-react'
import { ClerkTokenBridge, clerkConfigured, clerkPublishableKey } from './lib/clerk'
import ClerkRouteBoundary from './components/ClerkRouteBoundary'

function ClerkConfigWarning() {
  useEffect(() => {
    if (!clerkConfigured && import.meta.env.PROD) {
      console.warn('[PL TWEAKS] Clerk não inicializado: VITE_CLERK_PUBLISHABLE_KEY/NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY está vazio ou indefinido no build de produção.')
    }
  }, [])
  if (clerkConfigured || !import.meta.env.PROD) return null
  return (
    <div className="fixed inset-x-0 top-0 z-[100] border-b border-amber-500/40 bg-amber-950 px-4 py-3 text-center text-sm text-amber-100">
      O login está temporariamente indisponível: a chave pública do Clerk não foi encontrada neste build. Configure VITE_CLERK_PUBLISHABLE_KEY na Vercel e faça um novo deploy.
    </div>
  )
}

function Root() {
  const app = (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {clerkConfigured && <ClerkTokenBridge />}
        {clerkConfigured ? <ClerkRouteBoundary><App /></ClerkRouteBoundary> : <><ClerkConfigWarning /><App /></>}
      </BrowserRouter>
    </QueryClientProvider>
  )
  return clerkConfigured ? <ClerkProvider publishableKey={clerkPublishableKey} signInForceRedirectUrl="/app" signUpForceRedirectUrl="/app" signInFallbackRedirectUrl="/app" signUpFallbackRedirectUrl="/app">{app}</ClerkProvider> : app
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
