import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import AttendanceButton from '../components/AttendanceButton'
import ThreeDCube from '../components/ThreeDCube'
import { 
  AcademicCapIcon, 
  UserGroupIcon, 
  PresentationChartLineIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title)

const Dashboard = () => {
  const { user } = useAuth()
  const { socket, isConnected } = useSocket()
  const [stats, setStats] = useState({
  totalStudents: 10,
  totalPresent: 83.3,
  totalAbsent: 16.7,
    recentAttendance: [] as any[],
  })

  // Mock data for demonstration - matching the uploaded screenshots
  useEffect(() => {
    const mockStats = {
      totalStudents: 10,
      totalPresent: 83.3,
      totalAbsent: 16.7,
      recentAttendance: [
        { date: '2024-05-01', status: 'present', day: 1 },
        { date: '2024-05-02', status: 'present', day: 2 },
        { date: '2024-05-03', status: 'present', day: 3 },
        { date: '2024-05-04', status: 'absent', day: 4 },
        { date: '2024-05-05', status: 'present', day: 5 },
      ],
    }
    setStats(mockStats)
  }, [])

  // Listen for real-time attendance updates
  useEffect(() => {
    if (!socket) return

    const handleAttendanceUpdate = (data: any) => {
      console.log('Attendance update received:', data)
      // Update stats based on real-time data
    }

    socket.on('attendance:update', handleAttendanceUpdate)

    return () => {
      socket.off('attendance:update', handleAttendanceUpdate)
    }
  }, [socket])

  const doughnutData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [stats.totalPresent, stats.totalAbsent],
        backgroundColor: ['#3B82F6', '#10B981'],
        borderColor: ['#2563EB', '#059669'],
        borderWidth: 2,
      },
    ],
  }

  const barData = {
    labels: ['3', '2', '1'],
    datasets: [
      {
        label: 'Total Present',
        data: [9, 8, 8],
        backgroundColor: '#3B82F6',
      },
      {
        label: 'Total Absent',
        data: [1, 2, 2],
        backgroundColor: '#10B981',
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
      },
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 12,
      },
    },
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
            <div className="flex items-center mt-2">
              <CalendarIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
              <span className="text-sm text-gray-500 dark:text-gray-400">{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())}</span>
              {user && (
                <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
                  Welcome, {user.name || user.email}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThreeDCube size={56} speedSec={10} className="hidden md:block" />
            <AttendanceButton />
            <div className="flex items-center">
              <div className={`h-2.5 w-2.5 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Students */}
          <div className="bg-gradient-to-r from-sky-200 to-sky-300 dark:from-sky-600 dark:to-sky-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white dark:bg-sky-800 rounded-lg flex items-center justify-center">
                  <AcademicCapIcon className="h-6 w-6 text-sky-600 dark:text-sky-200" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Total Student</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          {/* Total Present */}
          <div className="bg-gradient-to-r from-sky-200 to-sky-300 dark:from-sky-600 dark:to-sky-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white dark:bg-sky-800 rounded-lg flex items-center justify-center">
                  <PresentationChartLineIcon className="h-6 w-6 text-sky-600 dark:text-sky-200" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Total Present</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalPresent}%</p>
              </div>
            </div>
          </div>

          {/* Total Absent */}
          <div className="bg-gradient-to-r from-sky-200 to-sky-300 dark:from-sky-600 dark:to-sky-700 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-white dark:bg-sky-800 rounded-lg flex items-center justify-center">
                  <UserGroupIcon className="h-6 w-6 text-sky-600 dark:text-sky-200" />
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-800 dark:text-white">Total Absent</h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalAbsent}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Attendance Bar Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Attendance</h3>
            <div className="h-80">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* Monthly Attendance Doughnut Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Attendance</h3>
            <div className="h-80 flex items-center justify-center">
              <div className="w-64 h-64 relative">
                <Doughnut data={doughnutData} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.totalPresent}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      -{stats.totalAbsent.toFixed(5)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard