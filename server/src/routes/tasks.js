import { Router } from 'express';
import { listTasks, getTask, createTask, updateTask, deleteTask, getMyTasks } from '../controllers/tasks.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

router.get('/', listTasks);
router.get('/mine', getMyTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;
