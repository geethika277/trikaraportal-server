import { Router } from 'express';
import { listActivities, createActivity, updateActivity, deleteActivity } from '../controllers/activities.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', listActivities);
router.post('/', createActivity);
router.put('/:id', updateActivity);
router.delete('/:id', deleteActivity);

export default router;
