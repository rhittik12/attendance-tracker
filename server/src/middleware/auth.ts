import { Request, Response, NextFunction } from 'express'
import { Socket } from 'socket.io'
import jwt from 'jsonwebtoken'
import { ApiError } from './errorHandler'
import User from '../models/user.model'
import { verifyToken as clerkVerifyToken } from '@clerk/backend'

// Interface for the JWT payload
interface JwtPayload {
  id: string
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any
    }
  }
}

// Middleware to authenticate HTTP requests
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Prefer Clerk if configured
    if (process.env.CLERK_SECRET_KEY) {
      const authHeader = req.header('Authorization')
      const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
      const token = bearer || req.cookies['__session'] || req.cookies['ClerkSession']
      if (!token) return next(ApiError.unauthorized('Authentication required'))
      
      try {
        const payload: any = await clerkVerifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY as string,
        })

        // Find or create a real Mongo user so we have a valid ObjectId everywhere
        const email = Array.isArray(payload.email) ? payload.email[0] : payload.email || payload.sub
        const name = payload.name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || 'User'

        // Upsert user with sane defaults; ensure we get a full doc with ObjectId
        const user = await User.findOneAndUpdate(
          { email },
          { name, status: 'active' },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        ).select('-password')

        req.user = user
        return next()
      } catch (clerkError) {
        console.error('Clerk verification failed:', clerkError)
        return next(ApiError.unauthorized('Invalid Clerk token'))
      }
    }
    
    // Legacy JWT handling (also with mock user)
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return next(ApiError.unauthorized('Authentication required'))
    }

    try {
  const secret = process.env.JWT_SECRET || 'secret'
  const decoded = jwt.verify(token, secret) as JwtPayload

      // Create mock user for JWT too
      const mockUser = {
        _id: decoded.id,
        email: `user-${decoded.id}@example.com`,
        name: 'User',
        role: 'student',
        status: 'active'
      }

      req.user = mockUser
      next()
    } catch (jwtError) {
      return next(ApiError.unauthorized('Invalid token'))
    }
  } catch (error) {
    next(error)
  }
}

// Middleware to check if user is admin
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    return next()
  }
  return next(ApiError.forbidden('Admin access required'))
}

// Middleware to check if user is teacher or admin
export const isTeacherOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && (req.user.role === 'teacher' || req.user.role === 'admin')) {
    return next()
  }
  return next(ApiError.forbidden('Teacher or admin access required'))
}

// Middleware to authenticate Socket.IO connections
export const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error('Authentication required'))
    }
    if (process.env.CLERK_SECRET_KEY) {
      try {
        const payload: any = await clerkVerifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY as string,
        })
        const email = Array.isArray(payload.email) ? payload.email[0] : payload.email || payload.sub
        const name = payload.name || `${payload.first_name || ''} ${payload.last_name || ''}`.trim() || 'User'
        const user = await User.findOneAndUpdate(
          { email },
          { name, status: 'active' },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        )
        socket.data.user = user
        return next()
      } catch (e) {
        return next(new Error('Invalid token'))
      }
    }

    // Fallback to local JWT
  const secret = process.env.JWT_SECRET || 'secret'
  const decoded = jwt.verify(token, secret) as JwtPayload
    const user = await User.findById(decoded.id).select('-password')
    if (!user) return next(new Error('User not found'))
    if (user.status !== 'active') return next(new Error('Account is inactive'))
    socket.data.user = user
    next()
  } catch (error) {
    next(error instanceof Error ? error : new Error('Authentication failed'))
  }
}