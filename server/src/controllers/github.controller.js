import { buildOAuthUrl, exchangeCodeForToken, processWebhookEvent, verifyWebhookSignature } from '../services/github.js';
import { env } from '../config/env.js';

export function initiateOAuth(req, res) {
  const state = `${req.user._id}:${Date.now()}`;
  const url = buildOAuthUrl(state);
  res.json({ url });
}

export async function oauthCallback(req, res) {
  const { code, state } = req.query;
  if (!code) return res.redirect(`${env.CLIENT_URL}/settings/github?error=no_code`);

  try {
    const token = await exchangeCodeForToken(code);
    res.redirect(`${env.CLIENT_URL}/settings/github?token=${token}`);
  } catch {
    res.redirect(`${env.CLIENT_URL}/settings/github?error=exchange_failed`);
  }
}

export async function webhook(req, res) {
  const sig = req.headers['x-hub-signature-256'];
  const rawBody = req.rawBody;

  if (!verifyWebhookSignature(rawBody, sig)) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  const event = req.headers['x-github-event'];
  await processWebhookEvent(event, req.body);
  res.json({ ok: true });
}
