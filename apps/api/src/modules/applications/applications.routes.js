import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { HttpError, notFound } from "../../lib/errors.js";
import { createUpload } from "../../lib/uploads.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";

const applicationSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  mobile_number: z.string().trim().min(3).max(40),
  country: z.string().trim().min(1).max(100),
  address: z.string().trim().min(1).max(500),
  higher_education: z.string().trim().min(1).max(100),
  passed_out_year: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  languages_known: z.string().trim().min(1).max(500),
  skills: z.string().trim().min(1).max(2000),
  experience_years: z.coerce.number().min(0).max(100),
  gender: z.enum(["male", "female", "other"]),
  career_level: z.enum(["fresher", "experienced"]),
  expected_salary: z.coerce.number().min(0),
});

const statusSchema = z.object({
  status: z.enum(["applied", "interviewing", "hired", "rejected"]),
});

export function createApplicationsRouter({ pool, config }) {
  const router = express.Router();
  const upload = createUpload(config, "resumes");

  router.get(
    "/mine",
    requireRole("candidate", "admin"),
    asyncHandler(async (request, response) => {
      const result = await pool.query(
        "SELECT a.id, a.job_id, a.candidate_id, a.first_name, a.last_name, a.mobile_number, " +
          "a.country, a.address, a.higher_education, a.passed_out_year, a.languages_known, " +
          "a.skills, a.experience_years, a.gender, a.career_level, a.expected_salary, " +
          "a.status, a.created_at, a.updated_at, '/api/applications/' || a.id || '/resume' AS resume, " +
          "json_build_object('id', j.id, 'title', j.title, " +
          "'company', json_build_object('id', c.id, 'name', c.name, 'logo_url', c.logo_url)) AS job " +
          "FROM applications a JOIN jobs j ON j.id = a.job_id " +
          "JOIN companies c ON c.id = j.company_id " +
          "WHERE a.candidate_id = $1 ORDER BY a.created_at DESC",
        [request.auth.user.id],
      );
      response.json(result.rows);
    }),
  );

  router.post(
    "/jobs/:jobId",
    requireRole("candidate", "admin"),
    upload.single("resume"),
    asyncHandler(async (request, response) => {
      const jobId = z.string().uuid().parse(request.params.jobId);
      const input = applicationSchema.parse(request.body);
      if (!request.file) throw new HttpError(400, "Resume is required", "resume_required");

      const job = await pool.query(
        "SELECT id, is_open, is_active, source_url FROM jobs WHERE id = $1",
        [jobId],
      );
      if (!job.rowCount) {
        await fs.unlink(request.file.path).catch(() => {});
        throw notFound("Job not found");
      }
      if (!job.rows[0].is_open || !job.rows[0].is_active) {
        await fs.unlink(request.file.path).catch(() => {});
        throw new HttpError(409, "This job is no longer accepting applications", "job_closed");
      }
      if (job.rows[0].source_url) {
        await fs.unlink(request.file.path).catch(() => {});
        throw new HttpError(409, "External jobs must be applied to on the source website", "external_application");
      }

      try {
        const result = await pool.query(
          "INSERT INTO applications(" +
            "job_id, candidate_id, first_name, last_name, mobile_number, country, address, " +
            "higher_education, passed_out_year, languages_known, skills, experience_years, gender, " +
            "career_level, expected_salary, resume_path, resume_name, resume_mime_type" +
            ") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *",
          [
            jobId,
            request.auth.user.id,
            input.first_name,
            input.last_name,
            input.mobile_number,
            input.country,
            input.address,
            input.higher_education,
            input.passed_out_year,
            input.languages_known,
            input.skills,
            input.experience_years,
            input.gender,
            input.career_level,
            input.expected_salary,
            request.file.filename,
            request.file.originalname,
            request.file.mimetype,
          ],
        );
        response.status(201).json(result.rows[0]);
      } catch (error) {
        await fs.unlink(request.file.path).catch(() => {});
        if (error?.code === "23505") {
          throw new HttpError(409, "You have already applied to this job", "already_applied");
        }
        throw error;
      }
    }),
  );

  router.patch(
    "/:id/status",
    requireRole("recruiter", "admin"),
    asyncHandler(async (request, response) => {
      const id = z.string().uuid().parse(request.params.id);
      const input = statusSchema.parse(request.body);
      const result = await pool.query(
        "UPDATE applications a SET status = $1 " +
          "FROM jobs j WHERE a.id = $2 AND j.id = a.job_id " +
          "AND (j.recruiter_id = $3 OR $4 = 'admin') RETURNING a.*",
        [input.status, id, request.auth.user.id, request.auth.user.role],
      );
      if (!result.rowCount) throw notFound("Application not found or not accessible");
      response.json(result.rows[0]);
    }),
  );

  router.get(
    "/:id/resume",
    requireAuth,
    asyncHandler(async (request, response) => {
      const id = z.string().uuid().parse(request.params.id);
      const result = await pool.query(
        "SELECT a.resume_path, a.resume_name, a.resume_mime_type, a.candidate_id, j.recruiter_id " +
          "FROM applications a JOIN jobs j ON j.id = a.job_id WHERE a.id = $1",
        [id],
      );
      if (!result.rowCount) throw notFound("Resume not found");
      const row = result.rows[0];
      const allowed =
        request.auth.user.role === "admin" ||
        row.candidate_id === request.auth.user.id ||
        row.recruiter_id === request.auth.user.id;
      if (!allowed) throw new HttpError(403, "Resume access denied", "forbidden");
      const filePath = path.resolve(config.uploadDir, "resumes", row.resume_path);
      response.type(row.resume_mime_type);
      response.download(filePath, row.resume_name);
    }),
  );

  return router;
}
