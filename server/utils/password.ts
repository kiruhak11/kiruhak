import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEYLEN = 64;
const SALT_LENGTH = 16;
const HASH_PREFIX = "scrypt";

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${HASH_PREFIX}:${salt}:${hash}`;
}

function verifyScryptPassword(password: string, stored: string): boolean {
  const [, salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const passwordHash = scryptSync(password, salt, SCRYPT_KEYLEN);
  const storedHash = Buffer.from(hash, "hex");
  if (passwordHash.length !== storedHash.length) return false;
  return timingSafeEqual(passwordHash, storedHash);
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored) return false;
  if (stored.startsWith(`${HASH_PREFIX}:`)) {
    return verifyScryptPassword(password, stored);
  }

  // Backward compatibility for legacy plaintext passwords.
  return password === stored;
}
