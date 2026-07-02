import winston from 'winston';
import { env } from '../config/env';

// Keys that must never be written to logs
const SENSITIVE_KEYS = [
  'token',
  'access_token',
  'encryptedToken',
  'anon_key',
  'service_role_key',
  'db_password',
  'jwt_secret',
  'password',
];

function redact(meta: Record<string, unknown>): Record<string, unknown> {
  const clone: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      clone[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      clone[key] = redact(value as Record<string, unknown>);
    } else {
      clone[key] = value;
    }
  }
  return clone;
}

const redactFormat = winston.format((info) => {
  const { level, message, timestamp, ...rest } = info;
  return { level, message, timestamp, ...redact(rest) };
});

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    redactFormat(),
    winston.format.json(),
  ),
  transports: [new winston.transports.Console()],
});
