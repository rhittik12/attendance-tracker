import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { CalendarIcon } from '@heroicons/react/24/outline'

interface Student {
  _id: string
  studentId: string
  name: string
  grade: string
}

type Status = 'present' | 'absent' | 'late' | 'excused'
interface AttendanceRecord {
  studentId: string
  date: string
  status: Status
}

const AttendanceForm = () => {
  const { user } = useAuth()
  const { socket } = useSocket()
  const canEdit = user?.role === 'admin' || user?.role === 'teacher'
  const [selectedMonth, setSelectedMonth] = useState(
    new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())
  )
  const [selectedGrade, setSelectedGrade] = useState('Class 1')
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<{ [key: string]: AttendanceRecord[] }>({})
  const [loading, setLoading] = useState(true)

  // Load data: if student, fetch their real attendance from API; if admin/teacher, show mock list (for now) and overlay any real data available.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        // Compute month start/end
        const [monthName, yearStr] = selectedMonth.split(' ')
        const monthIndex = new Date(`${monthName} 1, ${yearStr}`).getMonth()
        const year = parseInt(yearStr, 10)
        const start = new Date(year, monthIndex, 1)
        const end = new Date(year, monthIndex + 1, 0)
        const startISO = start.toISOString()
        const endISO = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999).toISOString()

        // Base students list
        let baseStudents: Student[]
        if (user?.role === 'student') {
          baseStudents = [
            {
              _id: user._id,
              studentId: (user._id || '').toString().slice(-3).padStart(3, '0'),
              name: user.name || 'You',
              grade: selectedGrade,
            },
          ]
        } else {
          baseStudents = Array.from({ length: 10 }, (_, i) => ({
            _id: String(i + 1),
            studentId: String(i + 1).padStart(3, '0'),
            name: `Student ${i + 1}`,
            grade: selectedGrade,
          }))
        }

        // Fetch attendance for the selected month
        const res = await axios.get('/api/attendance', {
          params: { startDate: startISO, endDate: endISO },
        })
        const records: any[] = res.data?.data || []

        // Build map keyed by student id
        const map: { [key: string]: AttendanceRecord[] } = {}
        baseStudents.forEach((s) => (map[s._id] = []))

        records.forEach((r: any) => {
          const sid = typeof r.student === 'object' && r.student?._id ? r.student._id : r.student
          const date = r.date
          const status: Status = r.status
          if (!map[sid]) map[sid] = []
          map[sid].push({ studentId: sid, date, status })
        })

        if (!cancelled) {
          setStudents(baseStudents)
          setAttendance(map)
        }
      } catch (e) {
        // Fallback to mock if API fails
        const mockStudents: Student[] = Array.from({ length: 10 }, (_, i) => ({
          _id: String(i + 1),
          studentId: String(i + 1).padStart(3, '0'),
          name: `Student ${i + 1}`,
          grade: selectedGrade,
        }))
        const mockMap: { [key: string]: AttendanceRecord[] } = {}
        mockStudents.forEach((s) => (mockMap[s._id] = []))
        if (!cancelled) {
          setStudents(user?.role === 'student' ? [] : mockStudents)
          setAttendance(mockMap)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [selectedGrade, selectedMonth, user])

  // Real-time: update on socket 'attendance:update'
  useEffect(() => {
    if (!socket) return
    const handler = (payload: any) => {
      const r = payload?.data || payload
      if (!r) return
      const sid = typeof r.student === 'object' && r.student?._id ? r.student._id : r.student
      const date = r.date
      const status: Status = r.status

      setAttendance((prev) => {
        const next = { ...prev }
        const list = (next[sid] = Array.isArray(next[sid]) ? [...next[sid]] : [])
        const dt = new Date(date)
        const day = dt.getDate()
        const idx = list.findIndex((x) => new Date(x.date).getDate() === day)
        const item: AttendanceRecord = { studentId: sid, date, status }
        if (idx >= 0) list[idx] = item
        else list.push(item)
        next[sid] = list
        return next
      })
    }
    socket.on('attendance:update', handler)
    return () => {
      socket.off('attendance:update', handler)
    }
  }, [socket])

  const getDaysInMonth = () => {
    const [monthName, yearStr] = selectedMonth.split(' ')
    const monthIndex = new Date(`${monthName} 1, ${yearStr}`).getMonth()
    const year = parseInt(yearStr, 10)
    const days = new Date(year, monthIndex + 1, 0).getDate()
    return Array.from({ length: days }, (_, i) => i + 1)
  }

  // Helpers for header rendering
  const getMonthYear = () => {
    const [monthName, yearStr] = selectedMonth.split(' ')
    const monthIndex = new Date(`${monthName} 1, ${yearStr}`).getMonth()
    const year = parseInt(yearStr, 10)
    return { monthIndex, year }
  }
  const isWeekend = (day: number) => {
    const { monthIndex, year } = getMonthYear()
    const d = new Date(year, monthIndex, day)
    const w = d.getDay() // 0=Sun,6=Sat
    return w === 0 || w === 6
  }
  const weekdayShort = (day: number) => {
    const { monthIndex, year } = getMonthYear()
    return new Date(year, monthIndex, day).toLocaleDateString(undefined, { weekday: 'short' })
  }

  const getAttendanceStatus = (studentId: string, day: number) => {
    const studentAttendance = attendance[studentId] || []
    const dayRecord = studentAttendance.find(record => new Date(record.date).getDate() === day)
    const st = dayRecord?.status
    if (!st) return 'absent'
    return st === 'present' || st === 'late' ? 'present' : 'absent'
  }

  const toggleAttendance = (studentId: string, day: number) => {
    if (!(user?.role === 'admin' || user?.role === 'teacher')) return

  const [monthName, yearStr] = selectedMonth.split(' ')
  const monthIndex = new Date(`${monthName} 1, ${yearStr}`).getMonth()
  const year = parseInt(yearStr, 10)
  const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${day.toString().padStart(2, '0')}`
    const currentStatus = getAttendanceStatus(studentId, day)
    const newStatus = currentStatus === 'present' ? 'absent' : 'present'

    setAttendance(prev => ({
      ...prev,
      [studentId]: [
        ...(prev[studentId] || []).filter(record => new Date(record.date).getDate() !== day),
        { studentId, date: dateStr, status: newStatus }
      ]
    }))
  }

  const handleSearch = () => {
    // No-op: data auto-loads on filter changes
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Attendance</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track and manage student attendance
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Month:
              </label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {/* Show current month dynamically plus two previous months */}
                  {(() => {
                    const now = new Date()
                    const opts: string[] = []
                    for (let i = 0; i < 3; i++) {
                      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                      opts.push(new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(d))
                    }
                    return opts.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))
                  })()}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Grade:
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
            >
              Search
            </button>
          </div>
        </div>

        {/* Attendance Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow ring-1 ring-black/5 dark:ring-white/10 overflow-auto">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
                {/* Fixed column widths for sticky positioning */}
                <th style={{ width: 100 }} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-0 z-30 bg-gray-100/80 dark:bg-gray-900/80">Student ID</th>
                <th style={{ width: 180 }} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky left-[100px] z-30 bg-gray-100/80 dark:bg-gray-900/80">Name</th>
                {getDaysInMonth().map((day) => (
                  <th
                    key={day}
                    className={`px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wider min-w-[52px] ${isWeekend(day) ? 'bg-gray-900/20 dark:bg-gray-700/30 text-gray-400' : 'text-gray-500 dark:text-gray-400'}`}
                    title={`${weekdayShort(day)} ${day}`}
                  >
                    <div className="leading-3">{day}</div>
                    <div className="text-[10px] opacity-70">{weekdayShort(day)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {students.map((student, rowIdx) => (
                <tr key={student._id} className={rowIdx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-800/70'}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white sticky left-0 z-20 bg-inherit">{student.studentId}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white sticky left-[100px] z-20 bg-inherit">{student.name}</td>
                  {getDaysInMonth().map((day) => {
                    const status = getAttendanceStatus(student._id, day)
                    const weekend = isWeekend(day)
                    return (
                      <td key={day} className={`px-2 py-2 text-center ${weekend ? 'bg-gray-900/5 dark:bg-gray-700/10' : ''}`}>
                        <button
                          onClick={() => toggleAttendance(student._id, day)}
                          disabled={!canEdit}
                          title={`${weekdayShort(day)} ${day} • ${status === 'present' ? 'Present' : 'Absent'}`}
                          className={`h-7 w-7 rounded-md border transition-all select-none focus:outline-none focus:ring-2 focus:ring-blue-500/60 ${
                            status === 'present'
                              ? 'bg-blue-500 text-white border-blue-500 shadow-inner hover:bg-blue-600'
                              : 'bg-gray-100 border-gray-300 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                          } ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                        >
                          {status === 'present' && (
                            <svg className="mx-auto h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded bg-blue-500"></span> Present</div>
          <div className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded bg-gray-600"></span> Absent</div>
          <div className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded bg-gray-700/30"></span> Weekend</div>
        </div>

        {/* Summary */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Attendance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {students.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Math.round(
                  (students.reduce((total, student) => {
                    const presentDays = getDaysInMonth().filter(day => 
                      getAttendanceStatus(student._id, day) === 'present'
                    ).length
                    return total + presentDays
                  }, 0) / (students.length * getDaysInMonth().length)) * 100
                )}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Overall Attendance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {getDaysInMonth().length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">School Days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendanceForm
