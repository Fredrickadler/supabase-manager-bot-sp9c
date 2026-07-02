import crypto from 'crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // recommended for GCM
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex'); // 32 bytes

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Output format: <iv>:<authTag>:<ciphertext> (all hex encoded)
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts a string previously produced by encrypt().
 */
export function decrypt(payload: string): string {
  const [ivHex, authTagHex, dataHex] = payload.split(':');
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error('Invalid encrypted payload format');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

/** Masks a secret for safe display, e.g. sbp_ab12************cd34 */
export function maskSecret(secret: string, visible = 4): string {
  if (secret.length <= visible * 2) return '*'.repeat(secret.length);
  return `${secret.slice(0, visible)}${'*'.repeat(8)}${secret.slice(-visible)}`;
}
