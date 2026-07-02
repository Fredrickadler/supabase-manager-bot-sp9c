import NodeCache from 'node-cache';
import crypto from 'crypto';

// TTL 10 minutes — long enough for a user to tap "Copy" after viewing credentials,
// short enough that secrets don't linger in memory.
const cache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export function storeForCopy(value: string): string {
  const ref = crypto.randomBytes(6).toString('hex');
  cache.set(ref, value);
  return ref;
}

export function retrieveForCopy(ref: string): string | undefined {
  return cache.get<string>(ref);
}
