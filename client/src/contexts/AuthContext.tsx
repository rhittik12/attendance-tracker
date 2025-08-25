import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-react'

interface User {
  _id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role: string) => Promise<void>
  logout: () => void
  updateUser: (u: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth()
  const { user: clerkUser, isLoaded: isUserLoaded } = useClerkUser()

  useEffect(() => {
    const loadUser = async () => {
      if (!isLoaded || !isUserLoaded) return
      try {
  // Configure axios base URL (priority: VITE_ -> NEXT_PUBLIC_ -> localStorage -> ?api=)
  function resolveApiBase(): string {
    const vite = (import.meta as any).env?.VITE_API_URL as string | undefined
    if (vite && vite.length > 0) return vite
    try { if (typeof __NEXT_PUBLIC_API_URL__ === 'string' && __NEXT_PUBLIC_API_URL__.length > 0) return __NEXT_PUBLIC_API_URL__ } catch {}
    try { const saved = localStorage.getItem('API_URL'); if (saved) return saved } catch {}
    try {
      const url = new URL(window.location.href)
      const p = url.searchParams.get('api') || undefined
      if (p) { localStorage.setItem('API_URL', p); url.searchParams.delete('api'); window.history.replaceState({}, document.title, url.toString()); return p }
    } catch {}
    return ''
  }
  const base = resolveApiBase()
  axios.defaults.baseURL = base
        if (!isSignedIn) {
          setUser(null)
          setToken(null)
          delete axios.defaults.headers.common['Authorization']
          setIsLoading(false)
          return
        }
        const t = await getToken({ template: 'default' })
        if (!t) {
          setUser(null)
          setToken(null)
          delete axios.defaults.headers.common['Authorization']
          setIsLoading(false)
          return
        }
        setToken(t)
        axios.defaults.headers.common['Authorization'] = `Bearer ${t}`
  const res = await axios.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${t}` },
        })
        setUser(res.data.user)
      } catch (error) {
        console.error('Failed to load user:', error)
        setUser(null)
        setToken(null)
        delete axios.defaults.headers.common['Authorization']
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [isLoaded, isUserLoaded, isSignedIn, clerkUser])

  const login = async () => {
    // Navigation handled by components
  }

  const register = async () => {
    // Navigation handled by components
  }

  const logout = async () => {
    try {
      await signOut()
      setToken(null)
      setUser(null)
      delete axios.defaults.headers.common['Authorization']
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const value = {
    user,
    token,
  isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  updateUser: (u: User) => setUser(u),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}