import { useEffect, useMemo, useState } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'

type Student = {
  _id: string
  studentId: string
  name: string
  email: string
  grade: string
  address: string
  contact: string
}

const Students = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const canManage = user?.role === 'admin' || user?.role === 'teacher'

  useEffect(() => {
    // Mock full directory (replace with API)
    const mock: Student[] = Array.from({ length: 10 }, (_, i) => ({
      _id: String(i + 1),
      studentId: String(i + 1).padStart(3, '0'),
      name: `Student ${i + 1}`,
      email: `student${i + 1}@example.com`,
      grade: `Class ${((i % 12) + 1)}`,
      address: `${100 + i} Main Street, City`,
      contact: `+1-555-010${i}`,
    }))
    setTimeout(() => {
      setStudents(mock)
      setLoading(false)
    }, 300)
  }, [])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return students.filter((s) =>
      (!gradeFilter || s.grade === gradeFilter) &&
      (!term || s.name.toLowerCase().includes(term) || s.email.toLowerCase().includes(term) || s.studentId.includes(term))
    )
  }, [students, search, gradeFilter])

  const addMockStudent = () => {
    const n = students.length + 1
    setStudents((prev) => [
      ...prev,
      {
        _id: String(n),
        studentId: String(n).padStart(3, '0'),
        name: `Student ${n}`,
        email: `student${n}@example.com`,
        grade: `Class ${((n % 12) || 12)}`,
        address: `${100 + n} Main Street, City`,
        contact: `+1-555-010${n}`,
      },
    ])
  }

  const removeStudent = (id: string) => setStudents((prev) => prev.filter((s) => s._id !== id))

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Students</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage student information and records</p>
          </div>
          {canManage && (
            <button onClick={addMockStudent} className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
              <PlusIcon className="h-5 w-5 mr-2" /> Add New Student
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Search</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or ID" className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Grade</label>
            <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="">All</option>
              {Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Student ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Grade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Address</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400">Contact</th>
                {canManage && <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{s.studentId}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{s.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{s.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{s.grade}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{s.address}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">{s.contact}</td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeStudent(s._id)} className="inline-flex items-center px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded">
                        <TrashIcon className="w-4 h-4 mr-1" /> Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Students
