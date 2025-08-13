import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import toast from 'react-hot-toast'

const AttendanceForm = () => {
  const { user, token } = useAuth()
  const { socket } = useSocket()
  const [isMarking, setIsMarking] = useState(false)
  const [message, setMessage] = useState('')

  const markAttendance = async () => {
    if (!user || !token) return

    setIsMarking(true)
    setMessage('')

    try {
      const base = (import.meta as any).env?.VITE_API_URL || ''
      const response = await fetch(`${base}/api/attendance/self`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
      status: 'present',
      notes: `Marked at ${new Date().toLocaleTimeString()}`,
        }),
      })

      if (response.ok) {
        setMessage('Attendance marked successfully!')
        toast.success('Attendance marked!')
        
        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('attendance:marked', {
            userId: user._id,
            date: new Date().toISOString().split('T')[0],
            status: 'present',
          })
        }
      } else {
        const errorData = await response.json()
        setMessage(errorData.message || 'Failed to mark attendance')
        toast.error('Failed to mark attendance')
      }
    } catch (error: any) {
      setMessage('Failed to mark attendance')
      toast.error('Failed to mark attendance')
    } finally {
      setIsMarking(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Please log in to mark attendance
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md mx-auto pt-20 p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Mark Attendance</h2>
          
          <div className="mb-4">
            <p className="text-gray-600 dark:text-gray-400">
              Welcome, {user.name || user.email}!
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Today's date: {new Date().toLocaleDateString()}
            </p>
          </div>

          <button
            onClick={markAttendance}
            disabled={isMarking}
            className={`w-full py-3 px-4 rounded-lg font-medium transition duration-200 ${
              isMarking
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            } text-white`}
          >
            {isMarking ? 'Marking...' : 'Mark Present'}
          </button>

          {message && (
            <div className={`mt-4 p-3 rounded-md ${
              message.includes('successfully')
                ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100'
                : 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AttendanceForm