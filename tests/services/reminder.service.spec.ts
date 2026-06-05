import { sendOverdueReminders } from '../../src/services/reminder.service';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('../../src/utils/db', () => ({
  __esModule: true,
  default: require('jest-mock-extended').mockDeep(),
}));
jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import prisma from '../../src/utils/db';
const prismaMock = prisma as any;

describe('Reminder Service', () => {
  beforeEach(() => {
    process.env.WEBHOOK_URL = 'https://discord.com/api/webhooks/mock';
  });

  it('should process overdue action items and write success history', async () => {
    const mockOverdue = [
      {
        id: 'item-1',
        task: 'Finish Hintro',
        assignee: 'Vishwanath',
        status: 'PENDING',
        dueDate: new Date(Date.now() - 10000), // in the past
      },
    ];

    prismaMock.actionItem.findMany.mockResolvedValue(mockOverdue);
    prismaMock.reminderHistory.create.mockResolvedValue({} as any);

    // Mock global fetch
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    global.fetch = fetchMock;

    await sendOverdueReminders();

    expect(prismaMock.actionItem.findMany).toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith('https://discord.com/api/webhooks/mock', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('Finish Hintro'),
    }));
    expect(prismaMock.reminderHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionItemId: 'item-1',
          status: 'SUCCESS',
        }),
      })
    );
  });

  it('should log FAILED when webhook fails', async () => {
    const mockOverdue = [
      {
        id: 'item-2',
        task: 'Overdue task',
        assignee: 'John',
        status: 'IN_PROGRESS',
        dueDate: new Date(Date.now() - 10000),
      },
    ];

    prismaMock.actionItem.findMany.mockResolvedValue(mockOverdue);
    prismaMock.reminderHistory.create.mockResolvedValue({} as any);

    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    });
    global.fetch = fetchMock;

    await sendOverdueReminders();

    expect(prismaMock.reminderHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actionItemId: 'item-2',
          status: 'FAILED',
          errorMessage: expect.stringContaining('400'),
        }),
      })
    );
  });
});
