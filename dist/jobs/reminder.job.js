"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initReminderJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const reminder_service_1 = require("../services/reminder.service");
const traceability_1 = require("../middlewares/traceability");
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
/**
 * Initializes the background cron scheduler for scanning overdue items.
 * Runs in the AsyncLocalStorage trace ID context.
 */
const initReminderJob = () => {
    // Default to every hour, but allow override via environment variable
    const schedule = process.env.CRON_SCHEDULE || '0 * * * *';
    logger_1.logger.info(`Initializing reminder background job with schedule: ${schedule}`);
    node_cron_1.default.schedule(schedule, () => {
        const traceId = `cron-reminder-${(0, uuid_1.v4)()}`;
        // Establish the AsyncLocalStorage storage run context so that winston logger
        // and reminder service database transactions inherit this trace ID.
        traceability_1.traceStorage.run(traceId, async () => {
            try {
                await (0, reminder_service_1.sendOverdueReminders)();
            }
            catch (err) {
                logger_1.logger.error('Critical error in scheduled reminder job execution', {
                    error: err.message,
                    traceId,
                });
            }
        });
    });
};
exports.initReminderJob = initReminderJob;
