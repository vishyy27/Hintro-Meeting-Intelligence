"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOverdueActionItems = exports.getActionItems = exports.updateStatus = exports.createActionItem = void 0;
const db_1 = __importDefault(require("../utils/db"));
/**
 * Creates a new action item assigned to a specific user or team member.
 * Optionally links it to a meeting and sets a due date.
 *
 * @param req - Express request containing task, assignee, meetingId, and dueDate.
 * @param res - Express response object.
 * @param next - Express next function.
 */
const createActionItem = async (req, res, next) => {
    try {
        const { task, assignee, meetingId, dueDate } = req.body;
        const userId = req.user.userId;
        if (!task || !assignee) {
            return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Task and assignee are required' });
        }
        const actionItem = await db_1.default.actionItem.create({
            data: {
                task,
                assignee,
                meetingId,
                dueDate: dueDate ? new Date(dueDate) : null,
                userId,
            },
        });
        res.status(201).json(actionItem);
    }
    catch (err) {
        next(err);
    }
};
exports.createActionItem = createActionItem;
/**
 * Updates the status of an existing action item.
 * Supports PENDING, IN_PROGRESS, and COMPLETED states.
 *
 * @param req - Express request containing action item ID in params and status in body.
 * @param res - Express response object.
 * @param next - Express next function.
 */
const updateStatus = async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const { status } = req.body;
        const userId = req.user.userId;
        if (!['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            return next({ status: 400, code: 'VALIDATION_ERROR', message: 'Invalid status' });
        }
        const actionItem = await db_1.default.actionItem.findUnique({ where: { id } });
        if (!actionItem || actionItem.userId !== userId) {
            return next({ status: 404, code: 'NOT_FOUND', message: 'Action item not found' });
        }
        const updated = await db_1.default.actionItem.update({
            where: { id },
            data: { status },
        });
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
};
exports.updateStatus = updateStatus;
/**
 * Retrieves a list of action items for the authenticated user.
 * Supports filtering by status, assignee, and meetingId.
 *
 * @param req - Express request containing optional filter queries.
 * @param res - Express response object.
 * @param next - Express next function.
 */
const getActionItems = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const { status, assignee, meetingId } = req.query;
        const filters = { userId };
        if (typeof status === 'string')
            filters.status = status;
        if (typeof assignee === 'string')
            filters.assignee = assignee;
        if (typeof meetingId === 'string')
            filters.meetingId = meetingId;
        const actionItems = await db_1.default.actionItem.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' },
        });
        res.json(actionItems.map((item) => ({
            ...item,
            citations: item.citations ? JSON.parse(item.citations) : null,
        })));
    }
    catch (err) {
        next(err);
    }
};
exports.getActionItems = getActionItems;
/**
 * Retrieves overdue action items (where status is not COMPLETED and dueDate is in the past).
 *
 * @param req - Express request
 * @param res - Express response
 * @param next - Express next function
 */
const getOverdueActionItems = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const now = new Date();
        const actionItems = await db_1.default.actionItem.findMany({
            where: {
                userId,
                status: { not: 'COMPLETED' },
                dueDate: { lt: now },
            },
            orderBy: { dueDate: 'asc' },
        });
        res.json(actionItems.map((item) => ({
            ...item,
            citations: item.citations ? JSON.parse(item.citations) : null,
        })));
    }
    catch (err) {
        next(err);
    }
};
exports.getOverdueActionItems = getOverdueActionItems;
