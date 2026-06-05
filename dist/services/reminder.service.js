"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOverdueReminders = void 0;
const db_1 = __importDefault(require("../utils/db"));
const traceability_1 = require("../middlewares/traceability");
const logger_1 = require("../utils/logger");
/**
 * Service to handle scanning for overdue action items,
 * dispatching reminders via webhook, and logging attempts in the database.
 */
const sendOverdueReminders = async () => {
    const traceId = (0, traceability_1.getTraceId)();
    logger_1.logger.info('Starting scheduled overdue action items check', { traceId });
    try {
        const now = new Date();
        // Query items status != COMPLETED and due date in the past
        const overdueItems = await db_1.default.actionItem.findMany({
            where: {
                status: { not: 'COMPLETED' },
                dueDate: { lt: now },
            },
        });
        if (overdueItems.length === 0) {
            logger_1.logger.info('No overdue action items found', { traceId });
            return;
        }
        logger_1.logger.info(`Found ${overdueItems.length} overdue action items to notify`, { traceId });
        const webhookUrl = process.env.WEBHOOK_URL;
        for (const item of overdueItems) {
            const formattedDate = item.dueDate ? item.dueDate.toISOString().split('T')[0] : 'N/A';
            const markdownMessage = `### Overdue Action Item Reminder\n- **Reminder**: ${item.task}\n  **Assigned To**: ${item.assignee}\n  **Due Date**: ${formattedDate}`;
            logger_1.logger.info(`Sending reminder for action item: ${item.id}`, { traceId, actionItemId: item.id });
            if (!webhookUrl) {
                const errorMsg = 'WEBHOOK_URL environment variable is not defined';
                logger_1.logger.error(errorMsg, { traceId, actionItemId: item.id });
                await db_1.default.reminderHistory.create({
                    data: {
                        actionItemId: item.id,
                        status: 'FAILED',
                        errorMessage: errorMsg,
                        traceId,
                    },
                });
                continue;
            }
            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        text: markdownMessage, // Slack compatibility
                        content: markdownMessage, // Discord compatibility
                    }),
                });
                if (!response.ok) {
                    throw new Error(`Webhook responded with status ${response.status}: ${response.statusText}`);
                }
                logger_1.logger.info(`Successfully dispatched reminder for action item: ${item.id}`, { traceId, actionItemId: item.id });
                await db_1.default.reminderHistory.create({
                    data: {
                        actionItemId: item.id,
                        status: 'SUCCESS',
                        traceId,
                    },
                });
            }
            catch (err) {
                const errMsg = err.message || String(err);
                logger_1.logger.error(`Failed to dispatch reminder for action item: ${item.id}`, { traceId, error: errMsg });
                await db_1.default.reminderHistory.create({
                    data: {
                        actionItemId: item.id,
                        status: 'FAILED',
                        errorMessage: errMsg,
                        traceId,
                    },
                });
            }
        }
    }
    catch (err) {
        logger_1.logger.error('Error during overdue reminder run', { traceId, error: err.message });
    }
};
exports.sendOverdueReminders = sendOverdueReminders;
