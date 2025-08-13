import express from 'express'
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  updatePassword,
  deleteUser,
  updateProfile,
} from '../controllers/user.controller'
import { authenticate, isAdmin } from '../middleware/auth'

const router = express.Router()

// Protect all routes
router.use(authenticate)

// Admin only routes
router.route('/')
  .get(isAdmin, getUsers)
  .post(isAdmin, createUser)

router.route('/:id')
  .get(isAdmin, getUser)
  .put(isAdmin, updateUser)
  .delete(isAdmin, deleteUser)

router.put('/:id/password', isAdmin, updatePassword)

// User profile route (for any authenticated user)
router.put('/profile', updateProfile)

export default router