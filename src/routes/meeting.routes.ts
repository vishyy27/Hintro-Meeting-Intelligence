import { Router } from 'express';
import { createMeeting, getMeeting, listMeetings, analyzeMeeting } from '../controllers/meeting.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createMeetingSchema, analyzeMeetingSchema } from '../schemas/meeting.schema';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createMeetingSchema), createMeeting);
router.get('/', listMeetings);
router.get('/:id', getMeeting);
router.post('/:id/analyze', validate(analyzeMeetingSchema), analyzeMeeting);

export default router;
