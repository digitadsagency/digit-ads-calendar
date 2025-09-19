import { randomBytes } from 'node:crypto';

export function generateReservationCode(): string {
  const randomString = randomBytes(3).toString('hex').toUpperCase();
  return `DIG-${randomString}`;
}

export function generateId(): string {
  return randomBytes(8).toString('hex');
}
