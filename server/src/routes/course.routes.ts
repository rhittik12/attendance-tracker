import express from 'express'
import {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  addStudents,
  removeStudents,
} from '../controllers/course.controller'
import { authenticate, isTeacherOrAdmin } from '../middleware/auth'

const router = express.Router()

// Protect all routes
router.use(authenticate)

// Routes accessible to all authenticated users
router.get('/', getCourses)
router.get('/:id', getCourse)

// Routes accessible only to teachers and admins
router.post('/', isTeacherOrAdmin, createCourse)
router.put('/:id', isTeacherOrAdmin, updateCourse)
router.delete('/:id', isTeacherOrAdmin, deleteCourse)

// Student management routes
router.post('/:id/students', isTeacherOrAdmin, addStudents)
router.delete('/:id/students', isTeacherOrAdmin, removeStudents)

export default router