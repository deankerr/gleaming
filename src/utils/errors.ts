type AppErrorStatus = 400 | 404 | 415 | 500

/**
 * Standard application error class for centralized error handling
 */
export class AppError extends Error {
  status: AppErrorStatus
  code?: string

  constructor(message: string, status: AppErrorStatus = 500, code?: string) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
  }

  toJSON() {
    return {
      error: this.message,
      status: this.status,
      code: this.code,
    }
  }
}

/**
 * Create a new AppError for a not found resource
 */
export function notFound(resource: string): AppError {
  return new AppError(`${resource} not found`, 404, 'NOT_FOUND')
}

/**
 * Create a new AppError for validation failures
 */
export function badRequest(message: string): AppError {
  return new AppError(message, 400, 'BAD_REQUEST')
}

/**
 * Create a new AppError for unsupported media types
 */
export function unsupportedMediaType(message: string): AppError {
  return new AppError(message, 415, 'UNSUPPORTED_MEDIA_TYPE')
}

/**
 * Create a new AppError for internal server errors
 */
export function internalError(message = 'Internal server error'): AppError {
  return new AppError(message, 500, 'INTERNAL_ERROR')
}
