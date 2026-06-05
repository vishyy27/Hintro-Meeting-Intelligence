import cron from 'node-cron';
import { sendOverdueReminders } from '../services/reminder.service';
import { traceStorage } from '../middlewares/traceability';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

/**
 * Initializes the background cron scheduler for scanning overdue items.
 * Runs in the AsyncLocalStorage trace ID context.
 */
export const initReminderJob = (): void => {
  // Default to every hour, but allow override via environment variable
  const schedule = process.env.CRON_SCHEDULE || '0 * * * *';

  logger.info(`Initializing reminder background job with schedule: ${schedule}`);

  cron.schedule(schedule, () => {
    const traceId = `cron-reminder-${uuidv4()}`;

    // Establish the AsyncLocalStorage storage run context so that winston logger
    // and reminder service database transactions inherit this trace ID.
    traceStorage.run(traceId, async () => {
      try {
        await sendOverdueReminders();
      } catch (err: any) {
        logger.error('Critical error in scheduled reminder job execution', {
          error: err.message,
          traceId,
        });
      }
    });
  });
};
