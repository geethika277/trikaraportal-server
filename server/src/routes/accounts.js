import { Router } from 'express';
import { listAccounts, getAccount, createAccount, updateAccount, deleteAccount } from '../controllers/accounts.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, ROLES } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);

router.get('/', listAccounts);
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.BDE, ROLES.PM), createAccount);
router.get('/:id', getAccount);
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.BDE, ROLES.PM), updateAccount);
router.delete('/:id', authorize(ROLES.SUPERADMIN), deleteAccount);

export default router;
