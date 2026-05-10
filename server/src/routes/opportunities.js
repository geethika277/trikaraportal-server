import { Router } from 'express';
import { listOpportunities, getOpportunity, createOpportunity, updateOpportunity, deleteOpportunity, convertToProject, getFunnelData } from '../controllers/opportunities.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, ROLES } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);
router.use(authorize(ROLES.SUPERADMIN, ROLES.BDE, ROLES.PM));

router.get('/', listOpportunities);
router.get('/funnel', getFunnelData);
router.post('/', createOpportunity);
router.get('/:id', getOpportunity);
router.put('/:id', updateOpportunity);
router.delete('/:id', authorize(ROLES.SUPERADMIN, ROLES.BDE), deleteOpportunity);
router.post('/:id/convert', convertToProject);

export default router;
