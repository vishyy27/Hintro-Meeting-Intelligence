import { z } from 'zod';

// Regex for MM:SS timestamp format
const timestampRegex = /^\d{2}:\d{2}$/;

const transcriptSegmentSchema = z.object({
  speaker: z.string().optional(),
  text: z.string().min(1, 'Transcript text cannot be empty'),
  timestamp: z.string().regex(timestampRegex, 'Timestamp must be in MM:SS format'),
});

export const createMeetingSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    meetingDate: z.string().datetime({ message: 'Invalid meetingDate, must be a valid ISO datetime' }),
    transcript: z.array(transcriptSegmentSchema).min(1, 'Transcript must contain at least one segment'),
  }),
});

export const analyzeMeetingSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid meeting ID'),
  }),
  body: z.array(transcriptSegmentSchema).optional(),
});
