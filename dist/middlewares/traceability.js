"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceabilityMiddleware = exports.getTraceId = exports.traceStorage = void 0;
const async_hooks_1 = require("async_hooks");
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
// ──────────────────────────────────────────────────────────
// AsyncLocalStorage propagates the trace ID through the
// entire async call chain — including across every `await`.
// Node ≥16 guarantees propagation through native Promises.
// ──────────────────────────────────────────────────────────
exports.traceStorage = new async_hooks_1.AsyncLocalStorage();
const getTraceId = () => {
    return exports.traceStorage.getStore() ?? 'N/A';
};
exports.getTraceId = getTraceId;
const traceabilityMiddleware = (req, res, next) => {
    const incoming = req.headers['x-trace-id'];
    // Header can be string | string[] | undefined — normalise to a single string
    const traceId = typeof incoming === 'string' && incoming.length > 0
        ? incoming
        : (0, uuid_1.v4)();
    // Attach to request object (typed via express.d.ts — no `as any`)
    req.traceId = traceId;
    // Echo trace ID back in every response header
    res.setHeader('x-trace-id', traceId);
    // Run the rest of the middleware / controller chain inside the
    // AsyncLocalStorage context so `getTraceId()` works everywhere.
    exports.traceStorage.run(traceId, () => {
        logger_1.logger.info('Incoming request', {
            method: req.method,
            path: req.originalUrl,
            ip: req.ip,
        });
        // Log when the response finishes — this fires inside the same
        // ALS context because the `finish` event listener was registered
        // inside `run()`.
        res.on('finish', () => {
            logger_1.logger.info('Request completed', {
                method: req.method,
                path: req.originalUrl,
                statusCode: res.statusCode,
            });
        });
        next();
    });
};
exports.traceabilityMiddleware = traceabilityMiddleware;
