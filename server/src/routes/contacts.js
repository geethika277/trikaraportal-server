import { Router } from 'express';
import { listContacts, getContact, createContact, updateContact, deleteContact } from '../controllers/contacts.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, ROLES } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);

router.get('/', listContacts);
router.post('/', authorize(ROLES.SUPERADMIN, ROLES.BDE, ROLES.PM), createContact);
router.get('/:id', getContact);
router.put('/:id', authorize(ROLES.SUPERADMIN, ROLES.BDE, ROLES.PM), updateContact);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.BDE), deleteContact);

export default router;
