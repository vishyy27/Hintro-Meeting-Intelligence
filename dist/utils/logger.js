"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const traceability_1 = require("../middlewares/traceability");
const { combine, timestamp, json, printf } = winston_1.default.format;
const traceFormat = printf(({ level, message, timestamp, ...metadata }) => {
    const traceId = (0, traceability_1.getTraceId)();
    return JSON.stringify({
        timestamp,
        level,
        traceId: traceId || 'N/A',
        message,
        ...metadata,
    });
});
exports.logger = winston_1.default.createLogger({
    level: 'info',
    format: combine(timestamp(), traceFormat),
    transports: [
        new winston_1.default.transports.Console()
    ],
});
