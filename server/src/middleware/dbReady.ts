import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'

export const dbReady = (req: Request, res: Response, next: NextFunction) => {
  // 1 = connected, 2 = connecting, 0 = disconnected, 3 = disconnecting
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database not connected. Please try again shortly.',
    })
  }
  next()
}
