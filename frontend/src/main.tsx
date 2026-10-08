import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { queryClient } from './lib/queryClient'
import { ClerkProvider } from '@clerk/clerk-react'
import { ClerkTokenBridge, clerkConfigured, clerkPublishableKey } from './lib/clerk'
import ClerkRouteBoundary from './components/ClerkRouteBoundary'

function Root() {
  const app = (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {clerkConfigured && <ClerkTokenBridge />}
        {clerkConfigured ? <ClerkRouteBoundary><App /></ClerkRouteBoundary> : <App />}
      </BrowserRouter>
    </QueryClientProvider>
  )
  return clerkConfigured ? <ClerkProvider publishableKey={clerkPublishableKey} signInFallbackRedirectUrl="/app" signUpFallbackRedirectUrl="/app">{app}</ClerkProvider> : app
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
