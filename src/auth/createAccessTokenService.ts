import { randomBytes } from "node:crypto";
import { AccessTokenService } from "./AccessTokenService.js";

export function createAccessTokenService(): AccessTokenService {
  const configuredSecret = process.env.JWT_SECRET?.trim();

  if (configuredSecret) {
    const secret = Buffer.from(configuredSecret, "utf8");
    if (secret.byteLength < 32) {
      throw new Error("JWT_SECRET doit contenir au moins 32 octets.");
    }

    return new AccessTokenService(secret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET doit être défini en production.");
  }

  console.warn("JWT_SECRET absent : une clé temporaire est utilisée pour ce démarrage local.");
  return new AccessTokenService(randomBytes(32));
}
