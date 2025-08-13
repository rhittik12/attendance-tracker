import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/user.model'
import { ApiError } from '../middleware/errorHandler'

// Generate JWT token
const generateToken = (id: string): string => {
  // Use a simple string as the secret
  const secret = process.env.JWT_SECRET || 'secret';
  // Explicitly type the payload and use Buffer for the secret
  return jwt.sign(
    { id } as { [key: string]: any },
    Buffer.from(secret),
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  )
}

// Set token in cookie
const sendTokenResponse = (user: any, statusCode: number, res: Response) => {
  // Create token
  const token = generateToken(user._id)

  // Cookie options
  const cookieOptions = {
    expires: new Date(
      Date.now() + parseInt(process.env.JWT_EXPIRE || '30') * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  }

  // Remove password from response
  user.password = undefined

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user,
    })
}

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction) => {
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
      role: role || 'student', // Default to student if role not provided
    })

    // Send token response
    sendTokenResponse(user, 201, res)
  } catch (error) {
    next(error)
  }
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body

    // Validate email & password
    if (!email || !password) {
      return next(ApiError.badRequest('Please provide email and password'))
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return next(ApiError.badRequest('Invalid email or password'))
    }

    // Check if user is active
    if (user.status !== 'active') {
      return next(ApiError.forbidden('Your account is inactive'))
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return next(ApiError.badRequest('Invalid email or password'))
    }

    // Send token response
    sendTokenResponse(user, 200, res)
  } catch (error) {
    next(error)
  }
}

// @desc    Logout user / clear cookie
// @route   GET /api/auth/logout
// @access  Private
export const logout = (req: Request, res: Response) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
    httpOnly: true,
  })

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  })
}

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    user: req.user,
  })
}