import { Router } from 'express';
import { listUsers, getUser, createUser, updateUser, deleteUser, updateProfile } from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, ROLES, ALL_ROLES } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize(ROLES.SUPERADMIN, ROLES.PM), listUsers);
router.post('/', authorize(ROLES.SUPERADMIN), createUser);
router.put('/me', updateProfile);
router.get('/:id', authorize(ROLES.SUPERADMIN, ROLES.PM), getUser);
router.put('/:id', authorize(ROLES.SUPERADMIN), updateUser);
router.delete('/:id', authorize(ROLES.SUPERADMIN), deleteUser);

export default router;
