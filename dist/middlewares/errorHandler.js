"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
// ──────────────────────────────────────────────────────────
// Global Error Handler
//
// Sets `res.locals.__errorPayload` and then calls `res.json()`
// which is intercepted by responseInterceptor to produce:
//   { traceId, success: false, error: { code, message } }
//
// Uses Winston (with trace context) instead of console.error.
// ──────────────────────────────────────────────────────────
const errorHandler = (err, req, res, _next) => {
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';
    const code = err.code || 'INTERNAL_ERROR';
    // Structured logging with trace context
    logger_1.logger.error(message, {
        code,
        statusCode,
        stack: err.stack,
    });
    // Communicate the error payload to the responseInterceptor
    res.locals.__errorPayload = { code, message };
    res.status(statusCode).json();
};
exports.errorHandler = errorHandler;
