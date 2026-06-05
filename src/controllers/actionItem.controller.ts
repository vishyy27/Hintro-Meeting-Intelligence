import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/db';

/**
 * Creates a new action item assigned to a specific user or team member.
 * Optionally links it to a meeting and sets a due date.
 *
 * @param req - Express request containing task, assignee, meetingId, and dueDate.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export const createActionItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { task, assignee, meetingId, dueDate } = req.body;
    const userId = req.user!.userId;

    if (!task || !assignee) {
      return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Task and assignee are required' });
    }

    const actionItem = await prisma.actionItem.create({
      data: {
        task,
        assignee,
        meetingId,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId,
      },
    });

    res.status(201).json(actionItem);
  } catch (err) {
    next(err);
  }
};

/**
 * Updates the status of an existing action item.
 * Supports PENDING, IN_PROGRESS, and COMPLETED states.
 *
 * @param req - Express request containing action item ID in params and status in body.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const { status } = req.body;
    const userId = req.user!.userId;

    if (!['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Invalid status' });
    }

    const actionItem = await prisma.actionItem.findUnique({ where: { id } });

    if (!actionItem || actionItem.userId !== userId) {
      return next({ status: 404, code: 'NOT_FOUND', message: 'Action item not found' });
    }

    const updated = await prisma.actionItem.update({
      where: { id },
      data: { status },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves a list of action items for the authenticated user.
 * Supports filtering by status, assignee, and meetingId.
 *
 * @param req - Express request containing optional filter queries.
 * @param res - Express response object.
 * @param next - Express next function.
 */
export const getActionItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { status, assignee, meetingId } = req.query;

    const filters: Record<string, string> = { userId };
    if (typeof status === 'string') filters.status = status;
    if (typeof assignee === 'string') filters.assignee = assignee;
    if (typeof meetingId === 'string') filters.meetingId = meetingId;

    const actionItems = await prisma.actionItem.findMany({
      where: filters,
      orderBy: { createdAt: 'desc' },
    });

    res.json(
      actionItems.map((item) => ({
        ...item,
        citations: item.citations ? JSON.parse(item.citations) : null,
      }))
    );
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves overdue action items (where status is not COMPLETED and dueDate is in the past).
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
export const getOverdueActionItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const now = new Date();

    const actionItems = await prisma.actionItem.findMany({
      where: {
        userId,
        status: { not: 'COMPLETED' },
        dueDate: { lt: now },
      },
      orderBy: { dueDate: 'asc' },
    });

    res.json(
      actionItems.map((item) => ({
        ...item,
        citations: item.citations ? JSON.parse(item.citations) : null,
      }))
    );
  } catch (err) {
    next(err);
  }
};
