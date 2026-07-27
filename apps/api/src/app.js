import fs from "node:fs";
import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { createApplicationsRouter } from "./modules/applications/applications.routes.js";
import { createAuthRouter } from "./modules/auth/auth.routes.js";
import { createCompaniesRouter } from "./modules/companies/companies.routes.js";
import { createInternalRouter } from "./modules/internal/import.routes.js";
import { createJobsRouter } from "./modules/jobs/jobs.routes.js";
import { createSessionAuthentication } from "./middleware/auth.js";
import { createCsrfProtection, createOriginGuard } from "./middleware/csrf.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp({ pool, config }) {
  const app = express();
  if (config.trustProxy) app.set("trust proxy", 1);

  const allowedOrigins = new Set(config.webOrigins);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "same-site" },
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) callback(null, true);
        else callback(new Error("Origin not allowed"));
      },
    }),
  );
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 600,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );
  app.use(express.json({ limit: "50mb", inflate: true }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(cookieParser());
  app.use(createOriginGuard(config));
  app.use(createSessionAuthentication({ pool, config }));
  app.use(createCsrfProtection(config));

  app.get("/api/health", async (_request, response, next) => {
    try {
      await pool.query("SELECT 1");
      response.json({ status: "ok" });
    } catch (error) {
      next(error);
    }
  });

  app.use(
    "/api/files/company-logos",
    express.static(path.resolve(config.uploadDir, "company-logos"), {
      dotfiles: "deny",
      fallthrough: false,
      immutable: true,
      maxAge: "7d",
    }),
  );
  app.use("/api/auth", createAuthRouter({ pool, config }));
  app.use("/api/companies", createCompaniesRouter({ pool, config }));
  app.use("/api/jobs", createJobsRouter({ pool, config }));
  app.use("/api/applications", createApplicationsRouter({ pool, config }));
  app.use("/api/internal", createInternalRouter({ pool, config }));

  if (config.webDistDir && fs.existsSync(config.webDistDir)) {
    const webRoot = path.resolve(config.webDistDir);
    app.use(express.static(webRoot, { index: false, maxAge: config.production ? "1h" : 0 }));
    app.use((request, response, next) => {
      if (request.path.startsWith("/api/")) {
        next();
        return;
      }
      response.sendFile(path.join(webRoot, "index.html"));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
