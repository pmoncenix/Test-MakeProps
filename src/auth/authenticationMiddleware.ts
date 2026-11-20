import type { Request, RequestHandler } from "express";
import type { AccessTokenService, AuthenticatedIdentity } from "./AccessTokenService.js";

export interface AuthenticatedRequest extends Request {
  auth: AuthenticatedIdentity;
}

const PUBLIC_AUTH_ROUTES = new Set([
  "POST /user/login",
  "POST /user/register",
]);

export function createAuthenticationMiddleware(accessTokenService: AccessTokenService): RequestHandler {
  return async (request, response, next) => {
    const normalizedPath = request.path.replace(/\/+$/, "") || "/";
    if (isPublicRoute(request.method, normalizedPath)) {
      next();
      return;
    }

    const authorization = request.get("authorization");
    const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];

    if (!token) {
      sendAuthenticationRequired(response);
      return;
    }

    const identity = await accessTokenService.verify(token);
    if (!identity) {
      sendAuthenticationRequired(response);
      return;
    }

    (request as AuthenticatedRequest).auth = identity;
    next();
  };
}

function isPublicRoute(method: string, path: string): boolean {
  if (PUBLIC_AUTH_ROUTES.has(`${method} ${path}`)) return true;

  if (method !== "GET" && method !== "HEAD") return false;
  return path === "/health"
    || path === "/api-docs.json"
    || path === "/api-docs"
    || path.startsWith("/api-docs/");
}

function sendAuthenticationRequired(response: Parameters<RequestHandler>[1]): void {
  response
    .set("WWW-Authenticate", "Bearer")
    .status(401)
    .json({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Un jeton Bearer valide est requis pour accéder à cette route.",
      },
    });
}
