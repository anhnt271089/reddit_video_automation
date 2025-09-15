import { FastifyReply } from 'fastify';
import { logger } from './logger.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/index.js';

/**
 * Standard error response interface
 */
export interface ErrorResponse {
  error: string;
  message?: string;
  details?: string;
  code?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Custom application error class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.INVALID_REQUEST) {
    super(message, HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR');
  }
}

/**
 * Not found error class
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }
}

/**
 * Conflict error class
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, HTTP_STATUS.CONFLICT, 'CONFLICT');
  }
}

/**
 * Send standardized error response
 */
export function sendErrorResponse(
  reply: FastifyReply,
  error: Error | AppError,
  requestId?: string
): void {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError
    ? error.statusCode
    : HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const errorCode = isAppError ? error.code : 'INTERNAL_ERROR';

  const errorResponse: ErrorResponse = {
    error: isAppError ? error.message : ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
    code: errorCode,
    timestamp: new Date().toISOString(),
    requestId,
  };

  // Add details for development environment
  if (process.env.NODE_ENV === 'development' && error.stack) {
    errorResponse.details = error.stack;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error:', {
      error: error.message,
      stack: error.stack,
      statusCode,
      requestId,
    });
  } else {
    logger.warn('Client error:', {
      error: error.message,
      statusCode,
      requestId,
    });
  }

  reply.status(statusCode).send(errorResponse);
}

/**
 * Async error handler wrapper
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      // Re-throw operational errors as they should be handled by the caller
      if (error instanceof AppError && error.isOperational) {
        throw error;
      }

      // Convert unexpected errors to AppError
      const appError = new AppError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        'UNEXPECTED_ERROR',
        false
      );

      logger.error('Unexpected error in async handler:', {
        originalError: error,
        convertedError: appError,
      });

      throw appError;
    }
  };
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }
}

/**
 * Validate enum values
 */
export function validateEnum<T extends string>(
  value: string,
  enumValues: readonly T[],
  fieldName: string
): asserts value is T {
  if (!enumValues.includes(value as T)) {
    throw new ValidationError(
      `Invalid ${fieldName}. Must be one of: ${enumValues.join(', ')}`
    );
  }
}

/**
 * Validate numeric range
 */
export function validateRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): void {
  if (value < min || value > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max}, got ${value}`
    );
  }
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string
): void {
  if (value.length < minLength || value.length > maxLength) {
    throw new ValidationError(
      `${fieldName} must be between ${minLength} and ${maxLength} characters, got ${value.length}`
    );
  }
}
