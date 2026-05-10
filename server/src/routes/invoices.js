import { Router } from 'express';
import { listInvoices, getInvoice, createInvoice, updateInvoice, updateInvoiceStatus, deleteInvoice, getRevenueSummary } from '../controllers/invoices.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize, ROLES } from '../middleware/rbac.js';

const router = Router();
router.use(authenticate);
router.use(authorize(ROLES.SUPERADMIN, ROLES.ACCOUNTING, ROLES.PM));

router.get('/', listInvoices);
router.get('/summary', getRevenueSummary);
router.post('/', createInvoice);
router.get('/:id', getInvoice);
router.put('/:id', updateInvoice);
router.patch('/:id/status', updateInvoiceStatus);
router.delete('/:id', deleteInvoice);

export default router;
