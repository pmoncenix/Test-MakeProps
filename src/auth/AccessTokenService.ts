import { jwtVerify, SignJWT } from "jose";

export interface AuthenticatedIdentity {
  userId: number;
  email: string;
}

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const ACCESS_TOKEN_ISSUER = "makeprops-api";
export const ACCESS_TOKEN_AUDIENCE = "makeprops-client";

export class AccessTokenService {
  constructor(private readonly secret: Uint8Array) {
    if (secret.byteLength < 32) {
      throw new Error("La clé de signature JWT doit contenir au moins 32 octets.");
    }
  }

  issue(user: { id: number; email: string }): Promise<string> {
    return new SignJWT({ email: user.email })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setSubject(String(user.id))
      .setIssuer(ACCESS_TOKEN_ISSUER)
      .setAudience(ACCESS_TOKEN_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
      .sign(this.secret);
  }

  async verify(token: string): Promise<AuthenticatedIdentity | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        algorithms: ["HS256"],
        issuer: ACCESS_TOKEN_ISSUER,
        audience: ACCESS_TOKEN_AUDIENCE,
      });

      if (
        typeof payload.sub !== "string"
        || !/^[1-9]\d*$/.test(payload.sub)
        || typeof payload.email !== "string"
      ) {
        return null;
      }

      const userId = Number(payload.sub);
      if (!Number.isSafeInteger(userId)) return null;

      return { userId, email: payload.email };
    } catch {
      return null;
    }
  }
}
