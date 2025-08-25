import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './contexts/ThemeContext'
import App from './App.tsx'
import './index.css'
import MissingConfig from './components/MissingConfig'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

declare const __NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY__: string

function getClerkPublishableKey(): string | undefined {
  // 1) Vite env
  const viteKey = (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY as string | undefined
  if (viteKey && viteKey.length > 0) return viteKey

  // 2) Vercel NEXT_PUBLIC_ fallback injected at build via Vite define
  if (typeof __NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY__ === 'string' && __NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY__.length > 0) {
    return __NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY__
  }

  // 3) Local storage override (set after first visit with ?pk=...)
  try {
    const saved = localStorage.getItem('CLERK_PUBLISHABLE_KEY')
    if (saved && saved.length > 0) return saved
  } catch {}

  // 4) URL query param (?pk=...) for quick testing
  try {
    const url = new URL(window.location.href)
    const fromQuery = url.searchParams.get('pk') || undefined
    if (fromQuery && fromQuery.length > 0) {
      // persist for subsequent reloads and clean the URL
      localStorage.setItem('CLERK_PUBLISHABLE_KEY', fromQuery)
      url.searchParams.delete('pk')
      window.history.replaceState({}, document.title, url.toString())
      return fromQuery
    }
  } catch {}

  return undefined
}

const clerkPubKey = getClerkPublishableKey()

const root = document.getElementById('root')!

if (!clerkPubKey) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <MissingConfig missing={["VITE_CLERK_PUBLISHABLE_KEY"]} />
    </React.StrictMode>,
  )
} else {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <ClerkProvider publishableKey={clerkPubKey}>
        <ThemeProvider>
          <BrowserRouter>
            <QueryClientProvider client={queryClient}>
              <App />
              <Toaster position="top-right" />
            </QueryClientProvider>
          </BrowserRouter>
        </ThemeProvider>
      </ClerkProvider>
    </React.StrictMode>,
  )
}