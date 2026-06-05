import prisma from '../utils/db';
import { getTraceId } from '../middlewares/traceability';
import { logger } from '../utils/logger';

/**
 * Service to handle scanning for overdue action items,
 * dispatching reminders via webhook, and logging attempts in the database.
 */
export const sendOverdueReminders = async (): Promise<void> => {
  const traceId = getTraceId();
  logger.info('Starting scheduled overdue action items check', { traceId });

  try {
    const now = new Date();
    // Query items status != COMPLETED and due date in the past
    const overdueItems = await prisma.actionItem.findMany({
      where: {
        status: { not: 'COMPLETED' },
        dueDate: { lt: now },
      },
    });

    if (overdueItems.length === 0) {
      logger.info('No overdue action items found', { traceId });
      return;
    }

    logger.info(`Found ${overdueItems.length} overdue action items to notify`, { traceId });

    const webhookUrl = process.env.WEBHOOK_URL;

    for (const item of overdueItems) {
      const formattedDate = item.dueDate ? item.dueDate.toISOString().split('T')[0] : 'N/A';
      const markdownMessage = `### Overdue Action Item Reminder\n- **Reminder**: ${item.task}\n  **Assigned To**: ${item.assignee}\n  **Due Date**: ${formattedDate}`;

      logger.info(`Sending reminder for action item: ${item.id}`, { traceId, actionItemId: item.id });

      if (!webhookUrl) {
        const errorMsg = 'WEBHOOK_URL environment variable is not defined';
        logger.error(errorMsg, { traceId, actionItemId: item.id });
        
        await prisma.reminderHistory.create({
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
            text: markdownMessage,      // Slack compatibility
            content: markdownMessage,   // Discord compatibility
          }),
        });

        if (!response.ok) {
          throw new Error(`Webhook responded with status ${response.status}: ${response.statusText}`);
        }

        logger.info(`Successfully dispatched reminder for action item: ${item.id}`, { traceId, actionItemId: item.id });

        await prisma.reminderHistory.create({
          data: {
            actionItemId: item.id,
            status: 'SUCCESS',
            traceId,
          },
        });
      } catch (err: any) {
        const errMsg = err.message || String(err);
        logger.error(`Failed to dispatch reminder for action item: ${item.id}`, { traceId, error: errMsg });

        await prisma.reminderHistory.create({
          data: {
            actionItemId: item.id,
            status: 'FAILED',
            errorMessage: errMsg,
            traceId,
          },
        });
      }
    }
  } catch (err: any) {
    logger.error('Error during overdue reminder run', { traceId, error: err.message });
  }
};
