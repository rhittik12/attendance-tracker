import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: ReactNode
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { token, isAuthenticated } = useAuth()
  const { getToken } = useClerkAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setIsConnected(false)
      }
      return
    }

  // Resolve socket URL: VITE_ -> NEXT_PUBLIC_ -> localStorage -> ?ws= -> same-origin
  function resolveSocketUrl(): string | undefined {
    const vite = (import.meta as any).env?.VITE_SOCKET_URL as string | undefined
    if (vite && vite.length > 0) return vite
    try { if (typeof __NEXT_PUBLIC_SOCKET_URL__ === 'string' && __NEXT_PUBLIC_SOCKET_URL__.length > 0) return __NEXT_PUBLIC_SOCKET_URL__ } catch {}
    try { const saved = localStorage.getItem('SOCKET_URL'); if (saved) return saved } catch {}
    try {
      const url = new URL(window.location.href)
      const p = url.searchParams.get('ws') || undefined
      if (p) { localStorage.setItem('SOCKET_URL', p); url.searchParams.delete('ws'); window.history.replaceState({}, document.title, url.toString()); return p }
    } catch {}
    return undefined
  }
  const url = resolveSocketUrl()
  const newSocket = io(url || '/', {
      auth: async (cb: any) => {
        const t = (await getToken()) || token
        cb({ token: t })
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

  newSocket.on('error', (error: any) => {
      console.error('Socket error:', error)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [token, isAuthenticated])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}