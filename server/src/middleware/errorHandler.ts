import { Request, Response, NextFunction } from 'express'

// Custom error class with status code
export class ApiError extends Error {
  statusCode: number
  errors?: any

  constructor(statusCode: number, message: string, errors?: any) {
    super(message)
    this.statusCode = statusCode
    this.errors = errors
    Object.setPrototypeOf(this, ApiError.prototype)
  }

  static badRequest(message: string, errors?: any) {
    return new ApiError(400, message, errors)
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new ApiError(401, message)
  }

  static forbidden(message: string = 'Forbidden') {
    return new ApiError(403, message)
  }

  static notFound(message: string = 'Resource not found') {
    return new ApiError(404, message)
  }

  static internal(message: string = 'Internal server error') {
    return new ApiError(500, message)
  }
}

// Error handler middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err)

  // If it's our custom API error
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    })
  }

  // Handle express-validator errors (from validate middleware)
  if ((err as any)?.errors && Array.isArray((err as any).errors) && (err as any).message === 'Validation failed') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: (err as any).errors,
    })
  }

  // Handle mongoose validation errors
  if (err.name === 'ValidationError') {
    const mongooseErr = err as any
    const details = mongooseErr.errors
      ? Object.values(mongooseErr.errors).map((e: any) => ({
          path: e.path,
          message: e.message,
          kind: e.kind,
        }))
      : undefined
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: details || mongooseErr.message,
    })
  }

  // Handle mongoose duplicate key errors (MongoError/MongoServerError)
  if ((err.name === 'MongoError' || err.name === 'MongoServerError') && (err as any).code === 11000) {
    const dup = err as any
    const fields = dup?.keyValue ? Object.keys(dup.keyValue) : []
    const fieldMsg = fields.length ? `Duplicate value for field(s): ${fields.join(', ')}` : 'Duplicate key error'
    return res.status(400).json({
      success: false,
      message: fieldMsg,
      errors: dup,
    })
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired',
    })
  }

  // Handle MongoDB server selection errors (e.g., Atlas IP not whitelisted)
  if (err.name === 'MongooseServerSelectionError' || err.message?.includes('Could not connect to any servers')) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable. Check Atlas IP allow list, credentials, and cluster status.',
      error: process.env.NODE_ENV === 'development' ? (err as any).message : undefined,
    })
  }

  // Default to 500 server error
  return res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? (err as any).message : undefined,
    stack: process.env.NODE_ENV === 'development' ? (err as any).stack : undefined,
  })
}