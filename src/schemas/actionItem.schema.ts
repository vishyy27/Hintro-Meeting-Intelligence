import { z } from 'zod';

export const createActionItemSchema = z.object({
  body: z.object({
    task: z.string().min(1, 'Task is required'),
    assignee: z.string().min(1, 'Assignee is required'),
    meetingId: z.string().uuid('Invalid meeting ID').optional(),
    dueDate: z.string().datetime({ message: 'Invalid dueDate, must be a valid ISO datetime' }).optional().nullable(),
  }),
});

export const updateActionItemStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid action item ID'),
  }),
  body: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  }),
});

export const getActionItemsSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
    assignee: z.string().optional(),
    meetingId: z.string().uuid('Invalid meeting ID').optional(),
  }).optional(),
});
