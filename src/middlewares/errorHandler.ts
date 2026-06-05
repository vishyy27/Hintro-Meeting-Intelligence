import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// ──────────────────────────────────────────────────────────
// Global Error Handler
//
// Sets `res.locals.__errorPayload` and then calls `res.json()`
// which is intercepted by responseInterceptor to produce:
//   { traceId, success: false, error: { code, message } }
//
// Uses Winston (with trace context) instead of console.error.
// ──────────────────────────────────────────────────────────
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode: number = err.status || 500;
  const message: string = err.message || 'Internal Server Error';
  const code: string = err.code || 'INTERNAL_ERROR';

  // Structured logging with trace context
  logger.error(message, {
    code,
    statusCode,
    stack: err.stack,
  });

  // Communicate the error payload to the responseInterceptor
  res.locals.__errorPayload = { code, message };
  res.status(statusCode).json();
};
