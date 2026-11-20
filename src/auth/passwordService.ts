import argon2 from "argon2";

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, ARGON2_OPTIONS);
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return argon2.verify(passwordHash, password);
}

export async function performDummyPasswordWork(password: string): Promise<void> {
  await hashPassword(password);
}
