import express from "express";
import { rateLimit } from "express-rate-limit";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { hashPassword, hashToken, randomToken, verifyPassword } from "../../lib/crypto.js";
import { HttpError } from "../../lib/errors.js";
import { requireAuth } from "../../middleware/auth.js";

const credentialsSchema = z.object({
  email: z.string().email().max(320).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(10).max(200),
});

const registerSchema = credentialsSchema.extend({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
});

const roleSchema = z.object({ role: z.enum(["candidate", "recruiter"]) });

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    unsafeMetadata: { role: row.role },
  };
}

function cookieOptions(config, httpOnly) {
  return {
    httpOnly,
    secure: config.production,
    sameSite: "lax",
    path: "/",
    maxAge: config.sessionTtlMs,
  };
}

async function createSession({ pool, config, request, response, userId }) {
  const sessionToken = randomToken();
  const csrfToken = randomToken();
  const expiresAt = new Date(Date.now() + config.sessionTtlMs);
  await pool.query(
    "INSERT INTO user_sessions " +
      "(user_id, token_hash, csrf_token_hash, ip_address, user_agent, expires_at) " +
      "VALUES ($1, $2, $3, $4, $5, $6)",
    [
      userId,
      hashToken(sessionToken),
      hashToken(csrfToken),
      request.ip || null,
      request.get("user-agent") || null,
      expiresAt,
    ],
  );
  response.cookie(config.sessionCookieName, sessionToken, cookieOptions(config, true));
  response.cookie(config.csrfCookieName, csrfToken, cookieOptions(config, false));
}

function clearSession(response, config) {
  const options = { secure: config.production, sameSite: "lax", path: "/" };
  response.clearCookie(config.sessionCookieName, options);
  response.clearCookie(config.csrfCookieName, options);
}

export function createAuthRouter({ pool, config }) {
  const router = express.Router();
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  });

  router.post(
    "/register",
    authLimiter,
    asyncHandler(async (request, response) => {
      const input = registerSchema.parse(request.body);
      const passwordHash = await hashPassword(input.password);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const created = await client.query(
          "INSERT INTO users(email, first_name, last_name) VALUES ($1, $2, $3) RETURNING *",
          [input.email, input.firstName, input.lastName],
        );
        await client.query(
          "INSERT INTO password_credentials(user_id, password_hash) VALUES ($1, $2)",
          [created.rows[0].id, passwordHash],
        );
        await client.query("COMMIT");
        await createSession({ pool, config, request, response, userId: created.rows[0].id });
        response.status(201).json({ user: publicUser(created.rows[0]) });
      } catch (error) {
        await client.query("ROLLBACK");
        if (error?.code === "23505") {
          throw new HttpError(409, "An account with this email already exists", "email_exists");
        }
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  router.post(
    "/login",
    authLimiter,
    asyncHandler(async (request, response) => {
      const input = credentialsSchema.parse(request.body);
      const result = await pool.query(
        "SELECT u.*, p.password_hash FROM users u " +
          "JOIN password_credentials p ON p.user_id = u.id " +
          "WHERE lower(u.email) = $1 AND u.status = 'active'",
        [input.email],
      );
      const valid = result.rowCount && (await verifyPassword(result.rows[0].password_hash, input.password));
      if (!valid) {
        throw new HttpError(401, "Invalid email or password", "invalid_credentials");
      }
      await createSession({ pool, config, request, response, userId: result.rows[0].id });
      response.json({ user: publicUser(result.rows[0]) });
    }),
  );

  router.get("/session", (request, response) => {
    response.json({ user: request.auth?.user || null });
  });

  router.post(
    "/logout",
    requireAuth,
    asyncHandler(async (request, response) => {
      await pool.query("UPDATE user_sessions SET revoked_at = now() WHERE id = $1", [request.auth.sessionId]);
      clearSession(response, config);
      response.status(204).end();
    }),
  );

  router.patch(
    "/role",
    requireAuth,
    asyncHandler(async (request, response) => {
      const input = roleSchema.parse(request.body);
      const result = await pool.query(
        "UPDATE users SET role = $1 WHERE id = $2 AND (role IS NULL OR role = $1) RETURNING *",
        [input.role, request.auth.user.id],
      );
      if (!result.rowCount) {
        throw new HttpError(409, "The account role is already set", "role_already_set");
      }
      response.json({ user: publicUser(result.rows[0]) });
    }),
  );

  return router;
}
