import express from 'express'
import {
  getAttendanceRecords,
  getAttendanceRecord,
  createAttendanceRecord,
  updateAttendanceRecord,
  deleteAttendanceRecord,
  getAttendanceStats,
  markSelfAttendance,
} from '../controllers/attendance.controller'
import { authenticate, isTeacherOrAdmin } from '../middleware/auth'

const router = express.Router()

// Protect all routes
router.use(authenticate)

// Routes accessible to all authenticated users
router.get('/', getAttendanceRecords)
router.get('/stats', getAttendanceStats)
router.get('/:id', getAttendanceRecord)
router.post('/self', markSelfAttendance)

// Allow students to mark their own attendance even if the client posts to /api/attendance
router.post('/', (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    return markSelfAttendance(req, res, next)
  }
  return next()
})

// Routes accessible only to teachers and admins
router.post('/', isTeacherOrAdmin, createAttendanceRecord)
router.put('/:id', isTeacherOrAdmin, updateAttendanceRecord)
router.delete('/:id', isTeacherOrAdmin, deleteAttendanceRecord)

export default router