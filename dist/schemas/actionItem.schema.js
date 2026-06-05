"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActionItemsSchema = exports.updateActionItemStatusSchema = exports.createActionItemSchema = void 0;
const zod_1 = require("zod");
exports.createActionItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        task: zod_1.z.string().min(1, 'Task is required'),
        assignee: zod_1.z.string().min(1, 'Assignee is required'),
        meetingId: zod_1.z.string().uuid('Invalid meeting ID').optional(),
        dueDate: zod_1.z.string().datetime({ message: 'Invalid dueDate, must be a valid ISO datetime' }).optional().nullable(),
    }),
});
exports.updateActionItemStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid action item ID'),
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
    }),
});
exports.getActionItemsSchema = zod_1.z.object({
    query: zod_1.z.object({
        status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']).optional(),
        assignee: zod_1.z.string().optional(),
        meetingId: zod_1.z.string().uuid('Invalid meeting ID').optional(),
    }).optional(),
});
