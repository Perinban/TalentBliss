import { hashToken } from "../lib/crypto.js";
import { HttpError } from "../lib/errors.js";

function mapUser(row) {
  return {
    id: row.user_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    unsafeMetadata: { role: row.role },
  };
}

export function createSessionAuthentication({ pool, config }) {
  return async function sessionAuthentication(request, _response, next) {
    const token = request.cookies?.[config.sessionCookieName];
    if (!token) {
      request.auth = null;
      next();
      return;
    }

    try {
      const result = await pool.query(
        "SELECT s.id AS session_id, s.csrf_token_hash, s.expires_at, " +
          "u.id AS user_id, u.email, u.first_name, u.last_name, u.role, u.status " +
          "FROM user_sessions s JOIN users u ON u.id = s.user_id " +
          "WHERE s.token_hash = $1 AND s.revoked_at IS NULL " +
          "AND s.expires_at > now() AND u.status = 'active'",
        [hashToken(token)],
      );

      if (!result.rowCount) {
        request.auth = null;
        next();
        return;
      }

      const row = result.rows[0];
      request.auth = {
        sessionId: row.session_id,
        csrfTokenHash: row.csrf_token_hash,
        user: mapUser(row),
      };
      pool
        .query("UPDATE user_sessions SET last_used_at = now() WHERE id = $1", [row.session_id])
        .catch(() => {});
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAuth(request, _response, next) {
  if (!request.auth) {
    next(new HttpError(401, "Authentication required", "unauthenticated"));
    return;
  }
  next();
}

export function requireRole(...roles) {
  return function roleGuard(request, _response, next) {
    if (!request.auth) {
      next(new HttpError(401, "Authentication required", "unauthenticated"));
      return;
    }
    if (!roles.includes(request.auth.user.role)) {
      next(new HttpError(403, "You do not have permission to perform this action", "forbidden"));
      return;
    }
    next();
  };
}
