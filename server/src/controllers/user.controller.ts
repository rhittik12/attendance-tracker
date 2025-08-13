import { Request, Response, NextFunction } from 'express'
import User from '../models/user.model'
import { ApiError } from '../middleware/errorHandler'

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-password')

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id).select('-password')

    if (!user) {
      return next(ApiError.notFound(`User not found with id of ${req.params.id}`))
    }

    res.status(200).json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Create user
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(ApiError.badRequest('Email already registered'))
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
    })

    res.status(201).json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, role, status } = req.body

    // Find user
    let user = await User.findById(req.params.id)

    if (!user) {
      return next(ApiError.notFound(`User not found with id of ${req.params.id}`))
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return next(ApiError.badRequest('Email already in use'))
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, status },
      { new: true, runValidators: true }
    ).select('-password')
    
    if (!updatedUser) {
      return next(ApiError.notFound(`User not found with id of ${req.params.id}`))
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update user password
// @route   PUT /api/users/:id/password
// @access  Private/Admin
export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body

    if (!password) {
      return next(ApiError.badRequest('Password is required'))
    }

    // Find user
    const user = await User.findById(req.params.id)

    if (!user) {
      return next(ApiError.notFound(`User not found with id of ${req.params.id}`))
    }

    // Update password
    user.password = password
    await user.save()

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return next(ApiError.notFound(`User not found with id of ${req.params.id}`))
    }

    // Prevent deleting self
    if (user._id.toString() === req.user._id.toString()) {
      return next(ApiError.badRequest('You cannot delete your own account'))
    }

    await user.deleteOne()

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Update own profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, currentPassword, newPassword } = req.body

    // Find user
    let user = await User.findById(req.user._id).select('+password')

    if (!user) {
      return next(ApiError.notFound('User not found'))
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return next(ApiError.badRequest('Email already in use'))
      }
    }

    // Update basic info
    user.name = name || user.name
    user.email = email || user.email

    // Update password if provided
    if (newPassword) {
      // Verify current password
      if (!currentPassword) {
        return next(ApiError.badRequest('Current password is required'))
      }

      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) {
        return next(ApiError.badRequest('Current password is incorrect'))
      }

      user.password = newPassword
    }

    // Save user
    await user.save()

    // Create a user object without the password for the response
    const userResponse: any = user.toObject()
    if ('password' in userResponse) {
      delete (userResponse as any).password
    }

    res.status(200).json({
      success: true,
      data: userResponse,
    })
  } catch (error) {
    next(error)
  }
}