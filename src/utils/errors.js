/**
 * @file errors.js
 * @description Custom application error classes for Kamello.
 *
 * All errors carry:
 *   - message     : Developer-facing description (English)
 *   - statusCode  : HTTP status code
 *   - code        : Machine-readable error code string
 *
 * User-facing messages (Spanish) are set at the controller/route level.
 */

/**
 * Base application error.
 * All custom errors extend this class.
 */
export class AppError extends Error {
  /**
   * @param {string} message    - Developer-facing error description
   * @param {number} statusCode - HTTP status code
   * @param {string} code       - Machine-readable error code (e.g. 'NOT_FOUND')
   */
  constructor(message, statusCode, code) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    // Capture a clean stack trace (excludes this constructor frame)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 404 Not Found
 * Use when a requested resource does not exist.
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * 401 Unauthorized
 * Use when the request lacks valid authentication credentials.
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * 403 Forbidden
 * Use when the authenticated user lacks permission for the action.
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * 400 Validation Error
 * Use when the request body / params fail schema validation.
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/**
 * 409 Conflict
 * Use when the request conflicts with the current state of the resource.
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}
