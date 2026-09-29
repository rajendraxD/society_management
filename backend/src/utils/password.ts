import bcrypt from "bcryptjs";

/**
 * bcryptjs over argon2/native bcrypt: pure JS, so `npm install` never fails on
 * a client machine without a build toolchain.
 */
const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
