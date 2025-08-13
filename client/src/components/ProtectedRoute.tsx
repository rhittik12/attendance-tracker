import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import LoadingScreen from './LoadingScreen'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isLoaded, isSignedIn } = useClerkAuth()
  const location = useLocation()

  if (!isLoaded) {
    return <LoadingScreen />
  }

  if (!isSignedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default ProtectedRoute