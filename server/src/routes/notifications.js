import { Router } from 'express';
import { listNotifications, markRead, markAllRead } from '../controllers/notifications.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', listNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', markRead);

export default router;
