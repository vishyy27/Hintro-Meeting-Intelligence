"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeMeetingSchema = exports.createMeetingSchema = void 0;
const zod_1 = require("zod");
// Regex for MM:SS timestamp format
const timestampRegex = /^\d{2}:\d{2}$/;
const transcriptSegmentSchema = zod_1.z.object({
    speaker: zod_1.z.string().optional(),
    text: zod_1.z.string().min(1, 'Transcript text cannot be empty'),
    timestamp: zod_1.z.string().regex(timestampRegex, 'Timestamp must be in MM:SS format'),
});
exports.createMeetingSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required'),
        meetingDate: zod_1.z.string().datetime({ message: 'Invalid meetingDate, must be a valid ISO datetime' }),
        transcript: zod_1.z.array(transcriptSegmentSchema).min(1, 'Transcript must contain at least one segment'),
    }),
});
exports.analyzeMeetingSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid meeting ID'),
    }),
    body: zod_1.z.array(transcriptSegmentSchema).optional(),
});
