import express from 'express'
import http from 'http'
import net from 'net'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'

// Routes
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import attendanceRoutes from './routes/attendance.routes'
import courseRoutes from './routes/course.routes'

// Middleware
import { errorHandler } from './middleware/errorHandler'
import { dbReady } from './middleware/dbReady'
import { authenticateSocket } from './middleware/auth'

// Load environment variables
dotenv.config()

// Create Express app
const app = express()
const server = http.createServer(app)

// Resolve allowed origins for CORS from env and add localhost dev ports
const envOrigins = (process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(',').map((o) => o.trim()).filter(Boolean)
  : [process.env.CLIENT_URL || 'http://localhost:3000']) as string[]

const devOrigins = process.env.NODE_ENV !== 'production'
  ? Array.from({ length: 11 }, (_, i) => `http://localhost:${3000 + i}`)
  : []

const allowedOrigins = Array.from(new Set([...envOrigins, ...devOrigins]))

// Set up Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

// Connect to MongoDB with retry and friendly diagnostics
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance-tracker'
const DB_RETRY_DELAY_MS = parseInt(process.env.DB_RETRY_DELAY_MS || '5000', 10)
const DB_MAX_ATTEMPTS = parseInt(process.env.DB_MAX_ATTEMPTS || '0', 10) // 0 = keep retrying

let dbAttempts = 0
const connectMongo = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
    } as any)
    console.log('Connected to MongoDB')
  } catch (err: any) {
    dbAttempts += 1
    const hostHint = (() => {
      try {
        const m = MONGODB_URI.match(/@([^/?]+)/)
        return m ? m[1] : ''
      } catch { return '' }
    })()
    console.error(
      `MongoDB connection error${hostHint ? ` (host: ${hostHint})` : ''}:`,
      err?.message || err
    )
    if (DB_MAX_ATTEMPTS > 0 && dbAttempts >= DB_MAX_ATTEMPTS) {
      console.error('Max DB connection attempts reached. Check Atlas IP allow list, credentials, and URI.')
      return
    }
    console.warn(`Retrying MongoDB connection in ${DB_RETRY_DELAY_MS}ms... (attempt ${dbAttempts})`)
    setTimeout(connectMongo, DB_RETRY_DELAY_MS)
  }
}

connectMongo()

// Middleware
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', dbReady, userRoutes)
app.use('/api/attendance', dbReady, attendanceRoutes)
app.use('/api/courses', dbReady, courseRoutes)

// Socket.IO middleware for authentication
io.use(authenticateSocket)

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`)

  // Join room based on user role
  if (socket.data.user) {
    const { role, _id } = socket.data.user
    socket.join(role) // Join room based on role (admin, teacher, student)
    socket.join(_id.toString()) // Join personal room

    console.log(`User ${_id} joined ${role} room`)
  }

  // Handle attendance events
  socket.on('attendance:create', (data) => {
    // Broadcast to relevant rooms (admin, teacher, specific students)
    io.to('admin').to('teacher').to(data.studentId).emit('attendance:update', data)
  })

  socket.on('attendance:update', (data) => {
    // Broadcast to relevant rooms (admin, teacher, specific students)
    io.to('admin').to('teacher').to(data.studentId).emit('attendance:update', data)
  })

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`)
  })
})

// Error handling middleware
app.use(errorHandler)

// Pin server to a single fixed port to keep client proxy stable
const BASE_PORT = parseInt(process.env.PORT || '5000', 10)

// Simple health endpoint (not gated by dbReady) for quick status checks
app.get('/health', (_req, res) => {
  const state = ['disconnected', 'connected', 'connecting', 'disconnecting'][
    mongoose.connection.readyState as 0 | 1 | 2 | 3
  ]
  res.json({ ok: true, dbState: state })
})

;(async () => {
  try {
    server.listen(BASE_PORT)
    server.on('listening', () => {
      console.log(`Server running on port ${BASE_PORT}`)
    })
    server.on('error', (err: any) => {
      if (err?.code === 'EADDRINUSE') {
        console.error(`Port ${BASE_PORT} is already in use.\n` +
          'Fix options:\n' +
          ' - Stop the process using the port (recommended).\n' +
          ' - Or change PORT in server .env and update client vite proxy to match.')
      } else {
        console.error('Server error:', err)
      }
      process.exit(1)
    })
  } catch (err: any) {
    console.error('Failed to start server:', err?.message || err)
    process.exit(1)
  }
})()

export { app, io }