import { Request } from 'express';

// ──────────────────────────────────────────────────────────
// Augment Express Request to carry traceId and user payload
// so we never need `(req as any)` casts anywhere.
// ──────────────────────────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      traceId: string;
      user?: {
        userId: string;
        iat?: number;
        exp?: number;
      };
    }
  }
}

export {};
