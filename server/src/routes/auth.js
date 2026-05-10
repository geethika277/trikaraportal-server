import { Router } from 'express';
import { register, login, refresh, logout, getMe, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, ROLES } from '../middleware/rbac.js';

const router = Router();

router.post('/register', authenticate, authorize(ROLES.SUPERADMIN), register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);

export default router;
