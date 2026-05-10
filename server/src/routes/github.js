import { Router } from 'express';
import { initiateOAuth, oauthCallback, webhook } from '../controllers/github.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/oauth', authenticate, initiateOAuth);
router.get('/callback', oauthCallback);
router.post('/webhook', webhook);

export default router;
