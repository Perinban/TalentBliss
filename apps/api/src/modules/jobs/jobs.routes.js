import express from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { notFound } from "../../lib/errors.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";

const listSchema = z.object({
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  company_id: z.string().uuid().optional(),
  searchQuery: z.string().trim().max(200).optional(),
  descriptionQuery: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(9),
});

const jobSchema = z.object({
  title: z.string().trim().min(2).max(250),
  description: z.string().trim().min(10),
  requirements: z.string().trim().min(1),
  country: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  company_id: z.string().uuid(),
  mode: z.string().trim().min(1).max(100),
  domain: z.string().trim().min(1).max(150),
  salary: z.string().trim().min(1).max(150),
});

const savedSchema = z.object({ saved: z.boolean() });
const statusSchema = z.object({ isOpen: z.boolean() });

function filters(input, offset = 0) {
  const values = [];
  const clauses = ["j.is_active = true"];
  const add = (clause, value) => {
    values.push(value);
    clauses.push(clause.replace("?", "$" + (offset + values.length)));
  };
  if (input.state) add("j.state ILIKE ?", "%" + input.state + "%");
  if (input.country) add("j.country ILIKE ?", "%" + input.country + "%");
  if (input.company_id) add("j.company_id = ?", input.company_id);
  if (input.searchQuery) add("j.title ILIKE ?", "%" + input.searchQuery + "%");
  if (input.descriptionQuery) add("j.description ILIKE ?", "%" + input.descriptionQuery + "%");
  return { values, where: clauses.join(" AND ") };
}

const jobColumns =
  "j.id, j.source, j.source_url AS job_url, j.recruiter_id, j.company_id, " +
  "j.title, j.description, j.requirements, j.country, j.state, j.location, " +
  "j.mode, j.domain, j.salary, j.employment_type, j.is_open AS \"isOpen\", " +
  "j.is_active, j.posted_at, j.created_at, j.updated_at";

function companyJson() {
  return "json_build_object('id', c.id, 'name', c.name, 'logo_url', c.logo_url, 'slug', c.slug) AS company";
}

export function createJobsRouter({ pool }) {
  const router = express.Router();

  router.get(
    "/",
    asyncHandler(async (request, response) => {
      const input = listSchema.parse(request.query);
      const userId = request.auth?.user.id || null;
      const selected = filters(input, 1);
      const counted = filters(input, 0);
      const offset = (input.page - 1) * input.limit;
      const result = await pool.query(
        "SELECT " + jobColumns + ", " + companyJson() + ", " +
          "CASE WHEN sj.id IS NULL THEN '[]'::json " +
          "ELSE json_build_array(json_build_object('id', sj.id)) END AS saved " +
          "FROM jobs j JOIN companies c ON c.id = j.company_id " +
          "LEFT JOIN saved_jobs sj ON sj.job_id = j.id AND sj.user_id = $1 " +
          "WHERE " + selected.where + " ORDER BY j.created_at DESC " +
          "LIMIT $" + (selected.values.length + 2) + " OFFSET $" + (selected.values.length + 3),
        [userId, ...selected.values, input.limit, offset],
      );
      const countResult = await pool.query(
        "SELECT count(*)::int AS total FROM jobs j WHERE " + counted.where,
        counted.values,
      );
      response.json({ jobs: result.rows, total: countResult.rows[0].total, page: input.page, limit: input.limit });
    }),
  );

  router.get(
    "/mine",
    requireRole("recruiter", "admin"),
    asyncHandler(async (request, response) => {
      const input = listSchema.parse(request.query);
      const selected = filters(input, 1);
      const counted = filters(input, 1);
      const offset = (input.page - 1) * input.limit;
      selected.where += " AND j.recruiter_id = $1";
      counted.where += " AND j.recruiter_id = $1";
      const result = await pool.query(
        "SELECT " + jobColumns + ", " + companyJson() + ", '[]'::json AS saved " +
          "FROM jobs j JOIN companies c ON c.id = j.company_id " +
          "WHERE " + selected.where + " ORDER BY j.created_at DESC " +
          "LIMIT $" + (selected.values.length + 2) + " OFFSET $" + (selected.values.length + 3),
        [request.auth.user.id, ...selected.values, input.limit, offset],
      );
      const countResult = await pool.query(
        "SELECT count(*)::int AS total FROM jobs j WHERE " + counted.where,
        [request.auth.user.id, ...counted.values],
      );
      response.json({ jobs: result.rows, total: countResult.rows[0].total, page: input.page, limit: input.limit });
    }),
  );

  router.get(
    "/saved",
    requireAuth,
    asyncHandler(async (request, response) => {
      const result = await pool.query(
        "SELECT sj.id, sj.created_at, " +
          "json_build_object(" +
          "'id', j.id, 'source', j.source, 'job_url', j.source_url, 'recruiter_id', j.recruiter_id, " +
          "'company_id', j.company_id, 'title', j.title, 'description', j.description, " +
          "'requirements', j.requirements, 'country', j.country, 'state', j.state, " +
          "'location', j.location, 'mode', j.mode, 'domain', j.domain, 'salary', j.salary, " +
          "'isOpen', j.is_open, 'created_at', j.created_at, " +
          "'company', json_build_object('id', c.id, 'name', c.name, 'logo_url', c.logo_url, 'slug', c.slug)" +
          ") AS job " +
          "FROM saved_jobs sj JOIN jobs j ON j.id = sj.job_id " +
          "JOIN companies c ON c.id = j.company_id " +
          "WHERE sj.user_id = $1 ORDER BY sj.created_at DESC",
        [request.auth.user.id],
      );
      response.json(result.rows);
    }),
  );

  router.get(
    "/:id",
    asyncHandler(async (request, response) => {
      const id = z.string().uuid().parse(request.params.id);
      const result = await pool.query(
        "SELECT " + jobColumns + ", " + companyJson() + ", " +
          "(SELECT count(*)::int FROM applications a WHERE a.job_id = j.id) AS application_count " +
          "FROM jobs j JOIN companies c ON c.id = j.company_id WHERE j.id = $1",
        [id],
      );
      if (!result.rowCount) throw notFound("Job not found");
      const job = result.rows[0];
      let applications = [];
      if (request.auth?.user.role === "recruiter" && job.recruiter_id === request.auth.user.id) {
        const applicationResult = await pool.query(
          "SELECT id, job_id, candidate_id, first_name, last_name, mobile_number, country, address, " +
            "higher_education, passed_out_year, languages_known, skills, experience_years, gender, " +
            "career_level, expected_salary, status, created_at, updated_at, " +
            "'/api/applications/' || id || '/resume' AS resume " +
            "FROM applications WHERE job_id = $1 ORDER BY created_at DESC",
          [id],
        );
        applications = applicationResult.rows;
      } else if (request.auth?.user.role === "candidate") {
        const applicationResult = await pool.query(
          "SELECT id, job_id, candidate_id, status, created_at, updated_at " +
            "FROM applications WHERE job_id = $1 AND candidate_id = $2",
          [id, request.auth.user.id],
        );
        applications = applicationResult.rows;
      }
      response.json({ ...job, applications });
    }),
  );

  router.post(
    "/",
    requireRole("recruiter", "admin"),
    asyncHandler(async (request, response) => {
      const input = jobSchema.parse(request.body);
      const company = await pool.query("SELECT 1 FROM companies WHERE id = $1", [input.company_id]);
      if (!company.rowCount) throw notFound("Company not found");
      const result = await pool.query(
        "INSERT INTO jobs(" +
          "source, recruiter_id, company_id, title, description, requirements, country, state, mode, domain, salary, posted_at" +
          ") VALUES ('portal', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now()) RETURNING *",
        [
          request.auth.user.id,
          input.company_id,
          input.title,
          input.description,
          input.requirements,
          input.country,
          input.state,
          input.mode,
          input.domain,
          input.salary,
        ],
      );
      response.status(201).json(result.rows[0]);
    }),
  );

  router.put(
    "/:id/saved",
    requireRole("candidate", "admin"),
    asyncHandler(async (request, response) => {
      const id = z.string().uuid().parse(request.params.id);
      const input = savedSchema.parse(request.body);
      if (input.saved) {
        const result = await pool.query(
          "INSERT INTO saved_jobs(user_id, job_id) VALUES ($1, $2) " +
            "ON CONFLICT (user_id, job_id) DO UPDATE SET job_id = EXCLUDED.job_id RETURNING id",
          [request.auth.user.id, id],
        );
        response.json(result.rows);
        return;
      }
      await pool.query("DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2", [request.auth.user.id, id]);
      response.json([]);
    }),
  );

  router.patch(
    "/:id/status",
    requireRole("recruiter", "admin"),
    asyncHandler(async (request, response) => {
      const id = z.string().uuid().parse(request.params.id);
      const input = statusSchema.parse(request.body);
      const result = await pool.query(
        "UPDATE jobs SET is_open = $1, closed_at = CASE WHEN $1 THEN NULL ELSE now() END " +
          "WHERE id = $2 AND (recruiter_id = $3 OR $4 = 'admin') RETURNING *",
        [input.isOpen, id, request.auth.user.id, request.auth.user.role],
      );
      if (!result.rowCount) throw notFound("Job not found or not owned by this recruiter");
      response.json(result.rows[0]);
    }),
  );

  router.delete(
    "/:id",
    requireRole("recruiter", "admin"),
    asyncHandler(async (request, response) => {
      const id = z.string().uuid().parse(request.params.id);
      const result = await pool.query(
        "UPDATE jobs SET is_active = false, is_open = false, closed_at = now() " +
          "WHERE id = $1 AND (recruiter_id = $2 OR $3 = 'admin') RETURNING id",
        [id, request.auth.user.id, request.auth.user.role],
      );
      if (!result.rowCount) throw notFound("Job not found or not owned by this recruiter");
      response.json(result.rows);
    }),
  );

  return router;
}
