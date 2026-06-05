import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// ──────────────────────────────────────────────────────────
// AsyncLocalStorage propagates the trace ID through the
// entire async call chain — including across every `await`.
// Node ≥16 guarantees propagation through native Promises.
// ──────────────────────────────────────────────────────────
export const traceStorage = new AsyncLocalStorage<string>();

export const getTraceId = (): string => {
  return traceStorage.getStore() ?? 'N/A';
};

export const traceabilityMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const incoming = req.headers['x-trace-id'];
  // Header can be string | string[] | undefined — normalise to a single string
  const traceId: string = typeof incoming === 'string' && incoming.length > 0
    ? incoming
    : uuidv4();

  // Attach to request object (typed via express.d.ts — no `as any`)
  req.traceId = traceId;

  // Echo trace ID back in every response header
  res.setHeader('x-trace-id', traceId);

  // Run the rest of the middleware / controller chain inside the
  // AsyncLocalStorage context so `getTraceId()` works everywhere.
  traceStorage.run(traceId, () => {
    logger.info('Incoming request', {
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    });

    // Log when the response finishes — this fires inside the same
    // ALS context because the `finish` event listener was registered
    // inside `run()`.
    res.on('finish', () => {
      logger.info('Request completed', {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
      });
    });

    next();
  });
};
