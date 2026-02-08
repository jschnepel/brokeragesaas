import { NextResponse } from 'next/server';

export interface APIError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export function createAPIError(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: Record<string, unknown>
): APIError {
  const error = new Error(message) as APIError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

export function handleAPIError(error: unknown): NextResponse {
  console.error('API Error:', error);

  if (error instanceof Error) {
    const apiError = error as APIError;
    const statusCode = apiError.statusCode || 500;
    const code = apiError.code || 'INTERNAL_ERROR';

    return NextResponse.json(
      {
        error: {
          message: apiError.message,
          code,
          ...(process.env.NODE_ENV === 'development' && {
            details: apiError.details,
            stack: apiError.stack,
          }),
        },
      },
      { status: statusCode }
    );
  }

  return NextResponse.json(
    {
      error: {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
    },
    { status: 500 }
  );
}

export class NotFoundError extends Error implements APIError {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error implements APIError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class UnauthorizedError extends Error implements APIError {
  statusCode = 401;
  code = 'UNAUTHORIZED';

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements APIError {
  statusCode = 403;
  code = 'FORBIDDEN';

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
