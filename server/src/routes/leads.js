import { Router } from 'express';
import { listLeads, getLead, createLead, updateLead, deleteLead, convertLead, getLeadsByStatus } from '../controllers/leads.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, ROLES } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);
router.use(authorize(ROLES.SUPERADMIN, ROLES.BDE, ROLES.PM));

router.get('/', listLeads);
router.get('/board', getLeadsByStatus);
router.post('/', createLead);
router.get('/:id', getLead);
router.put('/:id', updateLead);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.BDE), deleteLead);
router.post('/:id/convert', convertLead);

export default router;
