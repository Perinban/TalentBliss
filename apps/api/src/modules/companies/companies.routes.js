import express from "express";
import fs from "node:fs/promises";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { HttpError } from "../../lib/errors.js";
import { slugify } from "../../lib/slug.js";
import { createUpload } from "../../lib/uploads.js";
import { requireRole } from "../../middleware/auth.js";

const companySchema = z.object({ name: z.string().trim().min(2).max(200) });

export function createCompaniesRouter({ pool, config }) {
  const router = express.Router();
  const upload = createUpload(config, "company-logos");

  router.get(
    "/",
    asyncHandler(async (_request, response) => {
      const result = await pool.query(
        "SELECT id, slug, name, logo_url, website_url, source, created_at, updated_at " +
          "FROM companies ORDER BY name ASC",
      );
      response.json(result.rows);
    }),
  );

  router.post(
    "/",
    requireRole("recruiter", "admin"),
    upload.single("logo"),
    asyncHandler(async (request, response) => {
      const input = companySchema.parse(request.body);
      if (!request.file) {
        throw new HttpError(400, "Company logo is required", "logo_required");
      }
      const logoUrl = "/api/files/company-logos/" + request.file.filename;
      try {
        const result = await pool.query(
          "INSERT INTO companies(slug, name, logo_url, source, created_by) " +
            "VALUES ($1, $2, $3, 'portal', $4) RETURNING *",
          [slugify(input.name), input.name, logoUrl, request.auth.user.id],
        );
        response.status(201).json(result.rows[0]);
      } catch (error) {
        await fs.unlink(request.file.path).catch(() => {});
        if (error?.code === "23505") {
          throw new HttpError(409, "Company already exists", "company_exists");
        }
        throw error;
      }
    }),
  );

  return router;
}
