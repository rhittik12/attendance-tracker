import { SignUp, useAuth as useClerkAuth } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'

const Register = () => {
  const { isSignedIn, isLoaded } = useClerkAuth()
  
  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>
  }
  
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <SignUp routing="path" path="/register" signInUrl="/login" />
    </div>
  )
}

export default Register