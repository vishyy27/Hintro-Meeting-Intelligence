import { createMeetingSchema } from '../../src/schemas/meeting.schema';
import { ZodError } from 'zod';

describe('Validation Schemas', () => {
  describe('createMeetingSchema', () => {
    it('should pass with valid MM:SS timestamps', async () => {
      const validPayload = {
        body: {
          title: 'Weekly Sync',
          meetingDate: new Date().toISOString(),
          transcript: [
            { speaker: 'Alice', text: 'Hello team', timestamp: '00:00' },
            { speaker: 'Bob', text: 'Hi Alice', timestamp: '12:34' },
          ],
        },
      };

      await expect(createMeetingSchema.parseAsync(validPayload)).resolves.toEqual(validPayload);
    });

    it('should fail with invalid timestamps', async () => {
      const invalidPayload = {
        body: {
          title: 'Weekly Sync',
          meetingDate: new Date().toISOString(),
          transcript: [
            { speaker: 'Alice', text: 'Hello team', timestamp: '0:00' }, // Missing leading zero
            { speaker: 'Bob', text: 'Hi Alice', timestamp: '12:345' }, // Too long
          ],
        },
      };

      const result = await createMeetingSchema.safeParseAsync(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Timestamp must be in MM:SS format');
        expect(result.error.issues[1].message).toBe('Timestamp must be in MM:SS format');
      }
    });
  });
});
