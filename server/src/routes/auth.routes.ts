import express from 'express'
import { register, login, logout, getMe } from '../controllers/auth.controller'
import { body } from 'express-validator'
import { validate } from '../middleware/validate'
import { authenticate } from '../middleware/auth'

const router = express.Router()

// Public routes
if (!process.env.CLERK_SECRET_KEY) {
	router.post(
		'/register',
		validate([
			body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
			body('email').isEmail().withMessage('Valid email is required'),
			body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
			body('role').optional().isIn(['student', 'teacher', 'admin']).withMessage('Invalid role'),
		]),
		register
	)
	router.post(
		'/login',
		validate([
			body('email').isEmail().withMessage('Valid email is required'),
			body('password').notEmpty().withMessage('Password is required'),
		]),
		login
	)
	router.get('/logout', logout)
}

// Protected routes
router.get('/me', authenticate, getMe)

export default router