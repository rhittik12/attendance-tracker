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

const clerkPubKey = (import.meta as any).env?.VITE_CLERK_PUBLISHABLE_KEY

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