import crypto from 'crypto';
import { env } from '../config/env.js';

const ALGO = 'aes-256-ctr';
const key = Buffer.from(env.ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));

export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(hash) {
  const [ivHex, encHex] = hash.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const enc = Buffer.from(encHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString();
}
