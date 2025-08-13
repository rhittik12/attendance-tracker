import { NextFunction, Request, Response } from 'express'
import { ValidationChain, validationResult } from 'express-validator'
import { ApiError } from './errorHandler'

// Compose validation rules and send 400 with details if any fail
export const validate = (rules: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run validations sequentially
    for (const rule of rules) {
      const result = await rule.run(req)
      if (!result.isEmpty()) break
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return next(ApiError.badRequest('Validation failed', errors.array()))
    }

    next()
  }
}
