import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const AttendanceButton = () => {
  const [isMarking, setIsMarking] = useState(false)
  const { user } = useAuth()
  const { isLoaded, isSignedIn, getToken } = useClerkAuth()
  const { user: clerkUser } = useClerkUser()

  const markAttendance = async () => {
    // Build payload and auth header
    let authHeader: Record<string, string> | undefined
    let studentId = user?._id

    if (!studentId && isLoaded && isSignedIn) {
      // Use Clerk identity when our app user hasn't loaded yet
      const t = await getToken({ template: 'default' }).catch(() => undefined)
      if (t) authHeader = { Authorization: `Bearer ${t}` }
      studentId = clerkUser?.id || 'self'
    }

    if (!studentId && !isSignedIn) {
      // Local fallback: allow marking locally so user can test UI without login
      try {
        const key = 'local_attendance_' + new Date().toISOString().slice(0,10)
        localStorage.setItem(key, 'present')
        toast.success('Marked locally. Sign in to sync.')
      } catch {}
      return
    }

    setIsMarking(true)
    try {
      const response = await axios.post(
        '/api/attendance/self',
        {
          status: 'present',
          notes: `Marked at ${new Date().toLocaleTimeString()}`,
        },
        { headers: authHeader }
      )

      if (response.data.success) {
        toast.success('Attendance marked successfully!')
      }
    } catch (error: any) {
      console.error('Error marking attendance:', error)
      if (error.response?.status === 409) {
        toast.error('Attendance already marked for today!')
      } else {
        toast.error(error.response?.data?.message || 'Failed to mark attendance')
      }
    } finally {
      setIsMarking(false)
    }
  }

  return (
    <button
      onClick={markAttendance}
      disabled={isMarking}
      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
    >
      {isMarking ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Marking...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Mark Attendance
        </>
      )}
    </button>
  )
}

export default AttendanceButton
