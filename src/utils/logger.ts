import winston from 'winston';
import { getTraceId } from '../middlewares/traceability';

const { combine, timestamp, json, printf } = winston.format;

const traceFormat = printf(({ level, message, timestamp, ...metadata }) => {
  const traceId = getTraceId();
  return JSON.stringify({
    timestamp,
    level,
    traceId: traceId || 'N/A',
    message,
    ...metadata,
  });
});

export const logger = winston.createLogger({
  level: 'info',
  format: combine(timestamp(), traceFormat),
  transports: [
    new winston.transports.Console()
  ],
});
