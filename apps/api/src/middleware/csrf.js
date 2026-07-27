import { constantTimeEqual, hashToken } from "../lib/crypto.js";
import { HttpError } from "../lib/errors.js";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function createCsrfProtection(config) {
  return function csrfProtection(request, _response, next) {
    if (safeMethods.has(request.method) || !request.auth || request.path.startsWith("/api/internal/")) {
      next();
      return;
    }

    const headerToken = request.get("x-csrf-token");
    const cookieToken = request.cookies?.[config.csrfCookieName];
    if (!headerToken || !cookieToken || !constantTimeEqual(headerToken, cookieToken)) {
      next(new HttpError(403, "Invalid CSRF token", "invalid_csrf"));
      return;
    }

    if (!constantTimeEqual(hashToken(headerToken), request.auth.csrfTokenHash)) {
      next(new HttpError(403, "Invalid CSRF token", "invalid_csrf"));
      return;
    }
    next();
  };
}

export function createOriginGuard(config) {
  const allowed = new Set(config.webOrigins);
  return function originGuard(request, _response, next) {
    if (safeMethods.has(request.method) || request.path.startsWith("/api/internal/")) {
      next();
      return;
    }
    const origin = request.get("origin");
    if (origin && !allowed.has(origin)) {
      next(new HttpError(403, "Request origin is not allowed", "invalid_origin"));
      return;
    }
    next();
  };
}
