/**
 * Custom operational error class.
 * Use this for all expected errors (validation, not found, unauthorized, etc.)
 * Unexpected errors (bugs, DB crashes) should bubble up as plain Error.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Marks it as a known, handled error

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);

    // Fix prototype chain (needed when extending built-ins in TS)
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Convenience factories for common errors
export const NotFoundError = (resource: string) =>
  new AppError(`${resource} not found`, 404);

export const UnauthorizedError = (msg = 'Unauthorized') =>
  new AppError(msg, 401);

export const ForbiddenError = (msg = 'Forbidden') =>
  new AppError(msg, 403);

export const ConflictError = (msg: string) =>
  new AppError(msg, 409);

export const BadRequestError = (msg: string) =>
  new AppError(msg, 400);
