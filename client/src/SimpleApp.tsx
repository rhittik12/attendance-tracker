import React, { useState, useEffect, useMemo } from 'react'
import { Routes, Route, Link } from 'react-router-dom'

// Types
interface Student {
  id: number
  name: string
  email: string
  status: 'Present' | 'Absent' | 'Late'
}

interface AttendanceRecord {
  studentId: number
  studentName: string
  status: 'Present' | 'Absent' | 'Late'
  timestamp: string
}

// Global state for students and attendance
let globalStudents: Student[] = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Present' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Present' },
  { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'Absent' },
  { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', status: 'Present' },
]

let globalAttendanceRecords: AttendanceRecord[] = [
  { studentId: 1, studentName: 'John Doe', status: 'Present', timestamp: '2 min ago' },
  { studentId: 2, studentName: 'Jane Smith', status: 'Present', timestamp: '5 min ago' },
  { studentId: 3, studentName: 'Mike Johnson', status: 'Late', timestamp: '8 min ago' },
]

// Helper functions
const getAttendanceStats = () => {
  const total = globalStudents.length
  const present = globalStudents.filter(s => s.status === 'Present' || s.status === 'Late').length
  const rate = total > 0 ? Math.round((present / total) * 100) : 0
  return { total, present, rate }
}

const updateStudent = (studentId: number, updates: Partial<Student>) => {
  const index = globalStudents.findIndex(s => s.id === studentId)
  if (index !== -1) {
    globalStudents[index] = { ...globalStudents[index], ...updates }
  }
}

const deleteStudent = (studentId: number) => {
  globalStudents = globalStudents.filter(s => s.id !== studentId)
}

const addStudent = (student: Omit<Student, 'id'>) => {
  const newId = Math.max(...globalStudents.map(s => s.id), 0) + 1
  globalStudents.push({ ...student, id: newId })
}

const markAttendance = (studentId: number, status: 'Present' | 'Absent' | 'Late') => {
  const student = globalStudents.find(s => s.id === studentId)
  if (student) {
    updateStudent(studentId, { status })
    // Add to attendance records
    const newRecord: AttendanceRecord = {
      studentId,
      studentName: student.name,
      status,
      timestamp: 'just now'
    }
    globalAttendanceRecords.unshift(newRecord)
    // Keep only last 10 records
    if (globalAttendanceRecords.length > 10) {
      globalAttendanceRecords = globalAttendanceRecords.slice(0, 10)
    }
  }
}

// Simple Dashboard Component
function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Force re-render when data changes
  const refresh = () => setRefreshKey(prev => prev + 1)
  
  // Use refreshKey to ensure stats are recalculated when data changes
  const stats = useMemo(() => getAttendanceStats(), [refreshKey])
  
  const handleQuickAttendance = (status: 'Present' | 'Absent') => {
    // Mark a random absent student as present, or first present as absent
    if (status === 'Present') {
      const absentStudent = globalStudents.find(s => s.status === 'Absent')
      if (absentStudent) {
        markAttendance(absentStudent.id, 'Present')
        refresh()
      }
    } else {
      const presentStudent = globalStudents.find(s => s.status === 'Present')
      if (presentStudent) {
        markAttendance(presentStudent.id, 'Absent')
        refresh()
      }
    }
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Attendance Dashboard</h1>
        <button 
          onClick={refresh}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Refresh
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Today's Present</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.present}</p>
        </div>
        
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Total Students</h3>
          <p className="text-2xl font-bold text-green-600">{stats.total}</p>
        </div>
        
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">Attendance Rate</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.rate}%</p>
        </div>
      </div>
      
      <div className="mb-6">
        <button 
          onClick={() => handleQuickAttendance('Present')}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 mr-4"
        >
          Mark Someone Present
        </button>
        
        <button 
          onClick={() => handleQuickAttendance('Absent')}
          className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
        >
          Mark Someone Absent
        </button>
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {globalAttendanceRecords.slice(0, 5).map((record, index) => (
            <div key={`${record.studentId}-${index}`} className="flex justify-between items-center border-b pb-2">
              <span>{record.studentName} marked {record.status.toLowerCase()}</span>
              <span className="text-sm text-gray-500">{record.timestamp}</span>
            </div>
          ))}
          {globalAttendanceRecords.length === 0 && (
            <p className="text-gray-500">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Simple Students Component
function Students() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [newStudent, setNewStudent] = useState<{ name: string; email: string; status: 'Present' | 'Absent' | 'Late' }>({ name: '', email: '', status: 'Present' })
  
  const refresh = () => setRefreshKey(prev => prev + 1)
  
  // Force component to re-render when refreshKey changes
  const students = useMemo(() => [...globalStudents], [refreshKey])
  
  const handleEdit = (student: Student) => {
    setEditingStudent(student)
  }
  
  const handleSaveEdit = () => {
    if (editingStudent) {
      updateStudent(editingStudent.id, editingStudent)
      setEditingStudent(null)
      refresh()
    }
  }
  
  const handleDelete = (studentId: number) => {
    if (confirm('Are you sure you want to delete this student?')) {
      deleteStudent(studentId)
      refresh()
    }
  }
  
  const handleAddStudent = () => {
    if (newStudent.name && newStudent.email) {
      addStudent(newStudent)
      setNewStudent({ name: '', email: '', status: 'Present' })
      setShowAddForm(false)
      refresh()
    }
  }
  
  const handleStatusToggle = (student: Student) => {
    const newStatus = student.status === 'Present' ? 'Absent' : 'Present'
    updateStudent(student.id, { status: newStatus })
    markAttendance(student.id, newStatus)
    refresh()
  }
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Students</h1>
        <button 
          onClick={() => setShowAddForm(true)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add Student
        </button>
      </div>
      
      {showAddForm && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Add New Student</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Student Name"
              value={newStudent.name}
              onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
              className="border border-gray-300 rounded px-3 py-2"
            />
            <input
              type="email"
              placeholder="Email"
              value={newStudent.email}
              onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
              className="border border-gray-300 rounded px-3 py-2"
            />
            <select
              value={newStudent.status}
              onChange={(e) => setNewStudent({...newStudent, status: e.target.value as 'Present' | 'Absent' | 'Late'})}
              className="border border-gray-300 rounded px-3 py-2"
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>
          <div className="mt-4">
            <button 
              onClick={handleAddStudent}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
            >
              Save
            </button>
            <button 
              onClick={() => setShowAddForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {editingStudent?.id === student.id ? (
                    <input
                      type="text"
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                      className="border border-gray-300 rounded px-2 py-1"
                    />
                  ) : (
                    student.name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingStudent?.id === student.id ? (
                    <input
                      type="email"
                      value={editingStudent.email}
                      onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                      className="border border-gray-300 rounded px-2 py-1"
                    />
                  ) : (
                    student.email
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleStatusToggle(student)}
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer hover:opacity-80 ${
                      student.status === 'Present' 
                        ? 'bg-green-100 text-green-800' 
                        : student.status === 'Late'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {student.status}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editingStudent?.id === student.id ? (
                    <>
                      <button 
                        onClick={handleSaveEdit}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setEditingStudent(null)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleEdit(student)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {students.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No students found. Add a student to get started!</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Simple Attendance Form
function AttendanceForm() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [courseName, setCourseName] = useState('Computer Science 101')
  const [students, setStudents] = useState(globalStudents)
  
  const refresh = () => {
    setRefreshKey(prev => prev + 1)
    setStudents([...globalStudents])
  }
  
  // Sync with global students when they change
  useEffect(() => {
    setStudents([...globalStudents])
  }, [refreshKey, globalStudents])
  
  const handleStatusChange = (studentId: number, status: 'Present' | 'Absent' | 'Late') => {
    // Update local state
    setStudents(prev => prev.map(student => 
      student.id === studentId ? { ...student, status } : student
    ))
    
    // Update global state
    updateStudent(studentId, { status })
    markAttendance(studentId, status)
    
    // Force refresh
    setTimeout(refresh, 100)
  }
  
  const handleSubmit = () => {
    // Save attendance for all students
    students.forEach(student => {
      markAttendance(student.id, student.status)
    })
    
    alert(`Attendance saved for ${courseName} on ${selectedDate}`)
    refresh()
  }
  
  const markAllPresent = () => {
    students.forEach(student => {
      handleStatusChange(student.id, 'Present')
    })
  }
  
  const markAllAbsent = () => {
    students.forEach(student => {
      handleStatusChange(student.id, 'Absent')
    })
  }
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Mark Attendance</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Name
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex items-end space-x-2">
            <button
              onClick={markAllPresent}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm"
            >
              Mark All Present
            </button>
            <button
              onClick={markAllAbsent}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 text-sm"
            >
              Mark All Absent
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStatusChange(student.id, 'Present')}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          student.status === 'Present'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'Absent')}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          student.status === 'Absent'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Absent
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.id, 'Late')}
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          student.status === 'Late'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Late
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {students.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No students found. Please add students first!</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Save Attendance
          </button>
        </div>
      </div>
    </div>
  )
}

// Navigation Layout
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Attendance Tracker</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link 
                  to="/dashboard" 
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/students" 
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Students
                </Link>
                <Link 
                  to="/mark-attendance" 
                  className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm"
                >
                  Mark Attendance
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}

// Main App Component
export default function SimpleApp() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/mark-attendance" element={<AttendanceForm />} />
      </Routes>
    </Layout>
  )
}
