import "server-only";

import { randomBytes, scrypt as scryptCallback, scryptSync, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

function encodeHash(salt: Buffer, derivedKey: Buffer) {
  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

function decodeHash(hash: string) {
  const [algorithm, saltHex, keyHex] = hash.split(":");

  if (algorithm !== "scrypt" || !saltHex || !keyHex) {
    throw new Error("Invalid password hash format.");
  }

  return {
    salt: Buffer.from(saltHex, "hex"),
    key: Buffer.from(keyHex, "hex"),
  };
}

export function hashPasswordSync(password: string) {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, KEY_LENGTH) as Buffer;
  return encodeHash(salt, derivedKey);
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return encodeHash(salt, derivedKey);
}

export async function verifyPassword(password: string, hash: string) {
  try {
    const decoded = decodeHash(hash);
    const derivedKey = (await scrypt(password, decoded.salt, KEY_LENGTH)) as Buffer;
    return timingSafeEqual(derivedKey, decoded.key);
  } catch {
    return false;
  }
}

export function generateTemporaryPassword() {
  return randomBytes(6).toString("base64url");
}
