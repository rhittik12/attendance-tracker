// no React imports needed
import { Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Sidebar from './Sidebar'
import Header from './Header'

const Layout = () => {
  const { user } = useAuth()
  // Sidebar is always visible; no need for open state

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">{/* Changed background to match screenshot */}
      {/* Sidebar (always visible) */}
      <Sidebar 
        isOpen={true}
        setIsOpen={() => {}}
        user={user}
        isMobile={false}
      />

      {/* Main content */}
    <div className="flex flex-col w-0 flex-1 overflow-hidden pl-64">{/* reserve space for sidebar */}
  <Header user={user} />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-gray-50 dark:bg-gray-900">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout