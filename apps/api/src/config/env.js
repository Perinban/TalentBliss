import { z } from "zod";

const booleanValue = z.preprocess(
  (value) => value === true || value === "true" || value === "1",
  z.boolean(),
);

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  HOST: z.string().default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(24 * 30).default(168),
  SESSION_COOKIE_NAME: z.string().optional(),
  CSRF_COOKIE_NAME: z.string().default("talentbliss_csrf"),
  UPLOAD_DIR: z.string().default("./var/uploads"),
  WEB_DIST_DIR: z.string().optional(),
  PIPELINE_IMPORT_TOKEN: z.string().min(32).optional(),
  TRUST_PROXY: booleanValue.default(false),
});

export function loadConfig(source = process.env) {
  const parsed = environmentSchema.parse(source);
  const production = parsed.NODE_ENV === "production";
  return {
    nodeEnv: parsed.NODE_ENV,
    production,
    host: parsed.HOST,
    port: parsed.PORT,
    databaseUrl: parsed.DATABASE_URL,
    webOrigins: parsed.WEB_ORIGIN.split(",").map((value) => value.trim()).filter(Boolean),
    sessionTtlMs: parsed.SESSION_TTL_HOURS * 60 * 60 * 1000,
    sessionCookieName: parsed.SESSION_COOKIE_NAME || (production ? "__Host-talentbliss_session" : "talentbliss_session"),
    csrfCookieName: parsed.CSRF_COOKIE_NAME,
    uploadDir: parsed.UPLOAD_DIR,
    webDistDir: parsed.WEB_DIST_DIR,
    pipelineImportToken: parsed.PIPELINE_IMPORT_TOKEN,
    trustProxy: parsed.TRUST_PROXY,
  };
}
