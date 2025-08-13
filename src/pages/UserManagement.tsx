import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

interface User {
  _id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  createdAt: string
  status: 'active' | 'inactive'
}

const UserManagement = () => {
  useAuth() // Ensure auth is initialized; value isn't used here
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  })

  // Mock data for demonstration
  useEffect(() => {
    // In a real app, this would come from an API call
    const mockUsers: User[] = [
      {
        _id: '1',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: '2023-01-01T00:00:00.000Z',
        status: 'active',
      },
      {
        _id: '2',
        name: 'Teacher One',
        email: 'teacher1@example.com',
        role: 'teacher',
        createdAt: '2023-01-15T00:00:00.000Z',
        status: 'active',
      },
      {
        _id: '3',
        name: 'Teacher Two',
        email: 'teacher2@example.com',
        role: 'teacher',
        createdAt: '2023-02-01T00:00:00.000Z',
        status: 'inactive',
      },
      {
        _id: '4',
        name: 'Student One',
        email: 'student1@example.com',
        role: 'student',
        createdAt: '2023-02-15T00:00:00.000Z',
        status: 'active',
      },
      {
        _id: '5',
        name: 'Student Two',
        email: 'student2@example.com',
        role: 'student',
        createdAt: '2023-03-01T00:00:00.000Z',
        status: 'active',
      },
      {
        _id: '6',
        name: 'Student Three',
        email: 'student3@example.com',
        role: 'student',
        createdAt: '2023-03-15T00:00:00.000Z',
        status: 'inactive',
      },
    ]

    setTimeout(() => {
      setUsers(mockUsers)
      setFilteredUsers(mockUsers)
      setIsLoading(false)
    }, 1000) // Simulate API delay
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchTerm, roleFilter, users])

  const filterUsers = () => {
    let filtered = [...users]

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        user =>
          user.name.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
      )
    }

    // Filter by role
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate form
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role) {
      toast.error('All fields are required')
      setIsLoading(false)
      return
    }

    // In a real app, this would be an API call
    setTimeout(() => {
      const newId = (users.length + 1).toString()
      const createdUser: User = {
        _id: newId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role as 'admin' | 'teacher' | 'student',
        createdAt: new Date().toISOString(),
        status: 'active',
      }

      setUsers([...users, createdUser])
      setShowAddUserModal(false)
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'student',
      })
      toast.success('User added successfully')
      setIsLoading(false)
    }, 1000) // Simulate API delay
  }

  const handleToggleStatus = (userId: string) => {
    setIsLoading(true)

    // In a real app, this would be an API call
    setTimeout(() => {
      const updatedUsers: User[] = users.map(u => {
        if (u._id === userId) {
          const newStatus = (u.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive'
          return { ...u, status: newStatus }
        }
        return u
      })

      setUsers(updatedUsers)
      toast.success('User status updated')
      setIsLoading(false)
    }, 500) // Simulate API delay
  }

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setIsLoading(true)

      // In a real app, this would be an API call
      setTimeout(() => {
        const updatedUsers = users.filter(user => user._id !== userId)
        setUsers(updatedUsers)
        toast.success('User deleted successfully')
        setIsLoading(false)
      }, 500) // Simulate API delay
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
      <p className="mt-1 text-sm text-gray-500">
        Manage users and their access to the system.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="max-w-lg w-full lg:max-w-xs">
            <label htmlFor="search" className="sr-only">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                id="search"
                name="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Search users"
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex sm:mt-0 sm:ml-4">
          <select
            id="role-filter"
            name="role-filter"
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md mr-4"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
          <button
            type="button"
            onClick={() => setShowAddUserModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Add User
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-col">
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
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Role
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
                      Created At
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : user.role === 'teacher' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}
                          >
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                          >
                            {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleToggleStatus(user._id)}
                            className="text-primary-600 hover:text-primary-900 mr-4"
                          >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No users found. Try adjusting your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
              &#8203;
            </span>

            <div
              className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-headline"
            >
              <div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                    Add New User
                  </h3>
                  <div className="mt-2">
                    <form onSubmit={handleAddUser}>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Name
                          </label>
                          <input
                            type="text"
                            name="name"
                            id="name"
                            value={newUser.name}
                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                            className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                          </label>
                          <input
                            type="password"
                            name="password"
                            id="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Role
                          </label>
                          <select
                            id="role"
                            name="role"
                            value={newUser.role}
                            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            required
                          >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                      </div>
                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Adding...' : 'Add User'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddUserModal(false)}
                          className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement