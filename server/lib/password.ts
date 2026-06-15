import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const SALT_LEN = 16;
const KEY_LEN = 64;

/**
 * Hash a password using scrypt with a random salt.
 * Returns: salt:hash (hex encoded)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN);
  const derivedKey = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;
  return salt.toString("hex") + ":" + derivedKey.toString("hex");
}

/**
 * Verify a password against a stored hash.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;

  const salt = Buffer.from(parts[0], "hex");
  const storedKey = Buffer.from(parts[1], "hex");

  const derivedKey = (await scryptAsync(password, salt, KEY_LEN)) as Buffer;

  if (derivedKey.length !== storedKey.length) return false;
  return timingSafeEqual(derivedKey, storedKey);
}
