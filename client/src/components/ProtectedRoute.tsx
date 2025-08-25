import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { useAuth } from '@/contexts/AuthContext'
import LoadingScreen from './LoadingScreen'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoaded, isSignedIn } = useClerkAuth()
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isLoaded) {
    return <LoadingScreen />
  }

  // Allow when either Clerk is signed in OR our app auth is active (demo mode)
  if (!isSignedIn && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute