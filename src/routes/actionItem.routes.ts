import { Router } from 'express';
import { createActionItem, updateStatus, getActionItems, getOverdueActionItems } from '../controllers/actionItem.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import { createActionItemSchema, updateActionItemStatusSchema, getActionItemsSchema } from '../schemas/actionItem.schema';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createActionItemSchema), createActionItem);
router.get('/overdue', getOverdueActionItems);
router.patch('/:id/status', validate(updateActionItemStatusSchema), updateStatus);
router.get('/', validate(getActionItemsSchema), getActionItems);

export default router;
