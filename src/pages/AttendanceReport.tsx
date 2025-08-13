import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface AttendanceRecord {
  _id: string
  date: string
  course: string
  courseName: string
  student: {
    _id: string
    name: string
    email: string
  }
  status: 'present' | 'absent' | 'late'
  notes?: string
}

const AttendanceReport = () => {
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [course, setCourse] = useState('')
  const [student, setStudent] = useState('')
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [courses] = useState([
    { id: 'cs101', name: 'Introduction to Computer Science' },
    { id: 'math201', name: 'Advanced Mathematics' },
    { id: 'eng101', name: 'English Composition' },
    { id: 'phy101', name: 'Physics I' },
  ])
  const [students] = useState([
    { _id: '1', name: 'John Doe', email: 'john@example.com' },
    { _id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { _id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
    { _id: '4', name: 'Alice Williams', email: 'alice@example.com' },
    { _id: '5', name: 'Charlie Brown', email: 'charlie@example.com' },
  ])

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, this would come from an API call
    const mockRecords: AttendanceRecord[] = []
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    const dayDiff = Math.floor((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24))

    for (let i = 0; i <= dayDiff; i++) {
      const currentDate = new Date(startDateObj)
      currentDate.setDate(startDateObj.getDate() + i)
      const dateStr = format(currentDate, 'yyyy-MM-dd')

      // Skip weekends
      if (currentDate.getDay() === 0 || currentDate.getDay() === 6) continue

      courses.forEach(course => {
        students.forEach(student => {
          // Randomly assign status
          const statuses: ('present' | 'absent' | 'late')[] = ['present', 'absent', 'late']
          const randomStatus = statuses[Math.floor(Math.random() * (statuses.length - 0.2))] // Bias towards present

          mockRecords.push({
            _id: `${dateStr}-${course.id}-${student._id}`,
            date: dateStr,
            course: course.id,
            courseName: course.name,
            student: {
              _id: student._id,
              name: student.name,
              email: student.email,
            },
            status: randomStatus,
            notes: randomStatus === 'absent' ? 'Excused absence' : '',
          })
        })
      })
    }

    setRecords(mockRecords)
    setFilteredRecords(mockRecords)
  }, [])

  const handleFilter = () => {
    setIsLoading(true)
    setTimeout(() => {
      let filtered = [...records]

      // Filter by date range
      filtered = filtered.filter(
        record => record.date >= startDate && record.date <= endDate
      )

      // Filter by course
      if (course) {
        filtered = filtered.filter(record => record.course === course)
      }

      // Filter by student
      if (student) {
        filtered = filtered.filter(record => record.student._id === student)
      }

      setFilteredRecords(filtered)
      setIsLoading(false)
    }, 500) // Simulate API delay
  }

  const handleExport = () => {
    // Generate CSV
    const headers = ['Date', 'Course', 'Student', 'Email', 'Status', 'Notes']
    const csvRows = [
      headers.join(','),
      ...filteredRecords.map(record => {
        return [
          record.date,
          record.courseName,
          record.student.name,
          record.student.email,
          record.status,
          record.notes || '',
        ].join(',')
      }),
    ]
    const csvString = csvRows.join('\n')

    // Create download link
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `attendance_report_${startDate}_to_${endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Report exported successfully')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'late':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Attendance Reports</h1>
      <p className="mt-1 text-sm text-gray-500">
        View and export attendance records.
      </p>

      <div className="mt-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-4 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Filter Options</h3>
            <p className="mt-1 text-sm text-gray-500">
              Use these filters to narrow down the attendance records.
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-3">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start-date"
                  id="start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  name="end-date"
                  id="end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="course" className="block text-sm font-medium text-gray-700">
                  Course
                </label>
                <select
                  id="course"
                  name="course"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="student" className="block text-sm font-medium text-gray-700">
                  Student
                </label>
                <select
                  id="student"
                  name="student"
                  value={student}
                  onChange={(e) => setStudent(e.target.value)}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">All Students</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                type="button"
                onClick={handleFilter}
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Filtering...' : 'Apply Filters'}
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={filteredRecords.length === 0 || isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-secondary-600 hover:bg-secondary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Date
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Course
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Student
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((record) => (
                        <tr key={record._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.courseName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{record.student.name}</div>
                            <div className="text-sm text-gray-500">{record.student.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                record.status
                              )}`}
                            >
                              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {record.notes || '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          No records found. Try adjusting your filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AttendanceReport