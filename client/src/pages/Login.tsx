import { SignIn, useAuth as useClerkAuth } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

const Login = () => {
  const { isSignedIn, isLoaded } = useClerkAuth()
  
  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>
  }
  
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <SignIn routing="path" path="/login/*" signUpUrl="/register" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard" />
    </div>
  )
}

export default Login