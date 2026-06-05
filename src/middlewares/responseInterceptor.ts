import { Request, Response, NextFunction } from 'express';

// ──────────────────────────────────────────────────────────
// Unified Response Interceptor
//
// This middleware monkey-patches `res.json` so that EVERY
// JSON response automatically gets wrapped in the canonical
// envelope: { traceId, success, data } or { traceId, success, error }.
//
// Controllers should NEVER manually build this envelope.
// They just call `res.json(payload)` for success, or pass
// errors to `next(err)` for the error handler.
//
// The error handler sets `res.locals.__errorPayload` and
// then calls `res.json()` — the interceptor detects that
// flag and emits the error envelope instead.
// ──────────────────────────────────────────────────────────
export const responseInterceptor = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);

  res.json = function (body?: any): Response {
    // Exclude health check, evaluation, and Swagger UI endpoints from JSON wrapping
    if (req.path === '/health' || req.path === '/api/evaluation' || req.path.startsWith('/api-docs')) {
      return originalJson(body);
    }

    const traceId: string = req.traceId ?? 'N/A';

    // If the error handler already prepared an error payload,
    // emit the error envelope directly.
    const errorPayload = res.locals.__errorPayload as
      | { code: string; message: string }
      | undefined;

    if (errorPayload) {
      return originalJson({
        traceId,
        success: false,
        error: errorPayload,
      });
    }

    // Normal success path — wrap raw data
    return originalJson({
      traceId,
      success: true,
      data: body,
    });
  };

  next();
};
