import express from "express";
import { z } from "zod";
import { asyncHandler } from "../../lib/async-handler.js";
import { constantTimeEqual, sha256Json } from "../../lib/crypto.js";
import { HttpError } from "../../lib/errors.js";
import { slugify } from "../../lib/slug.js";

const sectionSchema = z.object({
  header: z.string().trim().min(1),
  content: z.string().trim().min(1),
});

const importedJobSchema = z.object({
  Company_Name: z.string().trim().min(1),
  Company_Logo_Url: z.string().url().nullable().optional(),
  Job_URL: z.string().url(),
  Job_Title: z.string().trim().min(1),
  Job_Location: z.string().trim().nullable().optional(),
  Job_Status: z.string().trim().nullable().optional(),
  Job_Domain: z.string().trim().min(1),
  Job_Salary: z.string().trim().nullable().optional(),
  Job_Details: z.array(sectionSchema).min(1),
  Last_Updated: z.string().trim().nullable().optional(),
  reject_reason: z.null().optional(),
});

const importSchema = z.object({
  source: z.string().trim().min(1).max(50).default("join"),
  runId: z.string().trim().max(200).optional(),
  runAttempt: z.string().trim().max(50).optional(),
  complete: z.boolean(),
  jobs: z.array(importedJobSchema).min(1).max(100_000),
});

const batchImportSchema = z
  .object({
    source: z.string().trim().min(1).max(50).default("join"),
    runId: z.string().trim().min(1).max(200),
    runAttempt: z.string().trim().min(1).max(50).default("1"),
    batchIndex: z.number().int().min(0),
    batchCount: z.number().int().min(1).max(2_000),
    jobs: z.array(importedJobSchema).min(1).max(5_000),
  })
  .superRefine((input, context) => {
    if (input.batchIndex >= input.batchCount) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["batchIndex"],
        message: "batchIndex must be smaller than batchCount",
      });
    }
  });

const finalizeSchema = z.object({
  source: z.string().trim().min(1).max(50).default("join"),
  runId: z.string().trim().min(1).max(200),
  runAttempt: z.string().trim().min(1).max(50).default("1"),
  batchCount: z.number().int().min(1).max(2_000),
});

function authorizePipeline(request, config) {
  if (!config.pipelineImportToken) {
    throw new HttpError(503, "Pipeline import is not configured", "pipeline_not_configured");
  }
  const header = request.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!supplied || !constantTimeEqual(supplied, config.pipelineImportToken)) {
    throw new HttpError(401, "Invalid pipeline credentials", "invalid_pipeline_token");
  }
}

function renderSections(sections) {
  return sections.map((section) => section.header + "\n" + section.content).join("\n\n");
}

function extractRequirements(sections) {
  const matching = sections.filter((section) => /require|qualification|profile|skill/i.test(section.header));
  return matching.length ? renderSections(matching) : null;
}

function parseTimestamp(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function stagingRows(jobs) {
  return jobs.map((job) => ({
    source_url: job.Job_URL,
    company_slug: slugify(job.Company_Name),
    company_name: job.Company_Name,
    logo_url: job.Company_Logo_Url || null,
    title: job.Job_Title,
    description: renderSections(job.Job_Details),
    requirements: extractRequirements(job.Job_Details),
    location: job.Job_Location || null,
    domain: job.Job_Domain,
    salary: job.Job_Salary || null,
    employment_type: job.Job_Status || null,
    posted_at: parseTimestamp(job.Last_Updated),
  }));
}

async function upsertJobs(client, source, jobs) {
  await client.query(
    "CREATE TEMP TABLE job_import_staging (" +
      "source_url text PRIMARY KEY, company_slug text NOT NULL, company_name text NOT NULL, " +
      "logo_url text, title text NOT NULL, description text NOT NULL, requirements text, " +
      "location text, domain text NOT NULL, salary text, employment_type text, posted_at timestamptz" +
      ") ON COMMIT DROP",
  );
  await client.query(
    "INSERT INTO job_import_staging " +
      "SELECT * FROM jsonb_to_recordset($1::jsonb) AS incoming(" +
      "source_url text, company_slug text, company_name text, logo_url text, title text, " +
      "description text, requirements text, location text, domain text, salary text, " +
      "employment_type text, posted_at timestamptz)",
    [JSON.stringify(stagingRows(jobs))],
  );

  await client.query(
    "INSERT INTO companies(slug, name, logo_url, source) " +
      "SELECT DISTINCT ON (company_slug) company_slug, company_name, logo_url, $1 " +
      "FROM job_import_staging ORDER BY company_slug, (logo_url IS NOT NULL) DESC, source_url " +
      "ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, " +
      "logo_url = COALESCE(EXCLUDED.logo_url, companies.logo_url)",
    [source],
  );

  const counts = await client.query(
    "WITH upserted AS (" +
      "INSERT INTO jobs(" +
      "source, source_url, company_id, title, description, requirements, location, domain, salary, " +
      "employment_type, is_open, is_active, posted_at, first_seen_at, last_seen_at" +
      ") SELECT $1, s.source_url, c.id, s.title, s.description, s.requirements, s.location, " +
      "s.domain, s.salary, s.employment_type, true, true, s.posted_at, now(), now() " +
      "FROM job_import_staging s JOIN companies c ON c.slug = s.company_slug " +
      "ON CONFLICT (source_url) WHERE source_url IS NOT NULL DO UPDATE SET " +
      "source = EXCLUDED.source, company_id = EXCLUDED.company_id, title = EXCLUDED.title, " +
      "description = EXCLUDED.description, requirements = EXCLUDED.requirements, " +
      "location = EXCLUDED.location, domain = EXCLUDED.domain, salary = EXCLUDED.salary, " +
      "employment_type = EXCLUDED.employment_type, is_open = true, is_active = true, " +
      "closed_at = NULL, posted_at = COALESCE(EXCLUDED.posted_at, jobs.posted_at), " +
      "last_seen_at = now() RETURNING (xmax = 0) AS inserted" +
      ") SELECT count(*) FILTER (WHERE inserted)::int AS inserted_count, " +
      "count(*) FILTER (WHERE NOT inserted)::int AS updated_count FROM upserted",
    [source],
  );
  return counts.rows[0];
}

async function findExistingRun(pool, input, checksum) {
  const result = await pool.query(
    "SELECT id, status, inserted_count, updated_count, discovered_count " +
      "FROM pipeline_runs WHERE source = $1 AND (checksum = $2 OR " +
      "(external_run_id = $3 AND external_run_attempt IS NOT DISTINCT FROM $4)) " +
      "ORDER BY created_at DESC LIMIT 1",
    [input.source, checksum, input.runId || null, input.runAttempt || null],
  );
  return result.rows[0] || null;
}

async function startRun(pool, input, checksum, existing) {
  if (existing) {
    const result = await pool.query(
      "UPDATE pipeline_runs SET external_run_id = $1, external_run_attempt = $2, checksum = $3, " +
        "status = 'running', complete_feed = $4, expected_batch_count = NULL, discovered_count = $5, inserted_count = 0, " +
        "updated_count = 0, rejected_count = 0, started_at = now(), completed_at = NULL, " +
        "error_message = NULL WHERE id = $6 RETURNING id, started_at",
      [input.runId || null, input.runAttempt || null, checksum, input.complete, input.jobs.length, existing.id],
    );
    return result.rows[0];
  }
  const result = await pool.query(
    "INSERT INTO pipeline_runs(" +
      "source, external_run_id, external_run_attempt, checksum, status, complete_feed, discovered_count" +
      ") VALUES ($1,$2,$3,$4,'running',$5,$6) RETURNING id, started_at",
    [input.source, input.runId || null, input.runAttempt || null, checksum, input.complete, input.jobs.length],
  );
  return result.rows[0];
}

async function findBatchRun(client, input, lock = false) {
  const result = await client.query(
    "SELECT id, status, started_at, expected_batch_count, discovered_count, inserted_count, updated_count " +
      "FROM pipeline_runs WHERE source = $1 AND external_run_id = $2 " +
      "AND external_run_attempt IS NOT DISTINCT FROM $3 " +
      "ORDER BY created_at DESC LIMIT 1" +
      (lock ? " FOR UPDATE" : ""),
    [input.source, input.runId, input.runAttempt],
  );
  return result.rows[0] || null;
}

async function getOrCreateBatchRun(client, input) {
  let run = await findBatchRun(client, input, true);
  if (!run) {
    const created = await client.query(
      "INSERT INTO pipeline_runs(" +
        "source, external_run_id, external_run_attempt, checksum, status, complete_feed, expected_batch_count" +
        ") VALUES ($1,$2,$3,NULL,'running',true,$4) " +
        "RETURNING id, status, started_at, expected_batch_count, discovered_count, inserted_count, updated_count",
      [input.source, input.runId, input.runAttempt, input.batchCount],
    );
    run = created.rows[0];
  }
  if (run.expected_batch_count !== input.batchCount) {
    throw new HttpError(409, "Batch count does not match the existing pipeline run", "batch_count_mismatch");
  }
  return run;
}

export function createInternalRouter({ pool, config }) {
  const router = express.Router();

  router.post(
    "/imports/jobs",
    asyncHandler(async (request, response) => {
      authorizePipeline(request, config);
      const input = importSchema.parse(request.body);
      const checksum = sha256Json(input.jobs);
      const existing = await findExistingRun(pool, input, checksum);
      if (existing?.status === "completed") {
        response.json({ idempotent: true, run: existing });
        return;
      }

      const run = await startRun(pool, input, checksum, existing);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const counts = await upsertJobs(client, input.source, input.jobs);
        const inserted = counts.inserted_count;
        const updated = counts.updated_count;

        if (input.complete) {
          await client.query(
            "UPDATE jobs SET is_active = false, is_open = false, closed_at = COALESCE(closed_at, now()) " +
              "WHERE source = $1 AND is_active = true AND last_seen_at < $2",
            [input.source, run.started_at],
          );
        }

        await client.query(
          "UPDATE pipeline_runs SET status = 'completed', inserted_count = $1, updated_count = $2, " +
            "completed_at = now() WHERE id = $3",
          [inserted, updated, run.id],
        );
        await client.query("COMMIT");
        response.status(201).json({
          idempotent: false,
          run: {
            id: run.id,
            discovered_count: input.jobs.length,
            inserted_count: inserted,
            updated_count: updated,
          },
        });
      } catch (error) {
        await client.query("ROLLBACK");
        await pool
          .query(
            "UPDATE pipeline_runs SET status = 'failed', completed_at = now(), error_message = $1 WHERE id = $2",
            [String(error.message || error).slice(0, 2000), run.id],
          )
          .catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  router.post(
    "/imports/jobs/batches",
    asyncHandler(async (request, response) => {
      authorizePipeline(request, config);
      const input = batchImportSchema.parse(request.body);
      const checksum = sha256Json(input.jobs);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const run = await getOrCreateBatchRun(client, input);
        const existingBatch = await client.query(
          "SELECT status, checksum, batch_count, discovered_count, inserted_count, updated_count " +
            "FROM pipeline_run_batches WHERE pipeline_run_id = $1 AND batch_index = $2",
          [run.id, input.batchIndex],
        );
        if (existingBatch.rowCount) {
          const batch = existingBatch.rows[0];
          if (batch.checksum !== checksum || batch.batch_count !== input.batchCount) {
            throw new HttpError(409, "Batch retry payload does not match the completed batch", "batch_checksum_mismatch");
          }
          if (batch.status === "completed") {
            await client.query("COMMIT");
            response.json({
              idempotent: true,
              batch: {
                batch_index: input.batchIndex,
                discovered_count: batch.discovered_count,
                inserted_count: batch.inserted_count,
                updated_count: batch.updated_count,
              },
            });
            return;
          }
        }
        if (run.status === "completed") {
          throw new HttpError(409, "Pipeline run is already finalized", "pipeline_run_completed");
        }

        await client.query(
          "INSERT INTO pipeline_run_batches(" +
            "pipeline_run_id, batch_index, batch_count, checksum, status, discovered_count" +
            ") VALUES ($1,$2,$3,$4,'running',$5) " +
            "ON CONFLICT (pipeline_run_id, batch_index) DO UPDATE SET " +
            "batch_count = EXCLUDED.batch_count, checksum = EXCLUDED.checksum, status = 'running', " +
            "discovered_count = EXCLUDED.discovered_count, inserted_count = 0, updated_count = 0, " +
            "started_at = now(), completed_at = NULL, error_message = NULL",
          [run.id, input.batchIndex, input.batchCount, checksum, input.jobs.length],
        );

        const counts = await upsertJobs(client, input.source, input.jobs);
        await client.query(
          "UPDATE pipeline_run_batches SET status = 'completed', inserted_count = $1, updated_count = $2, " +
            "completed_at = now() WHERE pipeline_run_id = $3 AND batch_index = $4",
          [counts.inserted_count, counts.updated_count, run.id, input.batchIndex],
        );
        await client.query(
          "UPDATE pipeline_runs SET discovered_count = discovered_count + $1, " +
            "inserted_count = inserted_count + $2, updated_count = updated_count + $3, error_message = NULL " +
            "WHERE id = $4",
          [input.jobs.length, counts.inserted_count, counts.updated_count, run.id],
        );
        await client.query("COMMIT");
        response.status(201).json({
          idempotent: false,
          batch: {
            batch_index: input.batchIndex,
            discovered_count: input.jobs.length,
            inserted_count: counts.inserted_count,
            updated_count: counts.updated_count,
          },
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  router.post(
    "/imports/jobs/finalize",
    asyncHandler(async (request, response) => {
      authorizePipeline(request, config);
      const input = finalizeSchema.parse(request.body);
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const run = await findBatchRun(client, input, true);
        if (!run) {
          throw new HttpError(404, "Pipeline run was not found", "pipeline_run_not_found");
        }
        if (run.expected_batch_count !== input.batchCount) {
          throw new HttpError(409, "Batch count does not match the pipeline run", "batch_count_mismatch");
        }
        if (run.status === "completed") {
          await client.query("COMMIT");
          response.json({
            idempotent: true,
            run: {
              id: run.id,
              discovered_count: run.discovered_count,
              inserted_count: run.inserted_count,
              updated_count: run.updated_count,
            },
          });
          return;
        }

        const batches = await client.query(
          "SELECT count(*)::int AS completed_count FROM pipeline_run_batches " +
            "WHERE pipeline_run_id = $1 AND status = 'completed'",
          [run.id],
        );
        if (batches.rows[0].completed_count !== input.batchCount) {
          throw new HttpError(409, "Not all expected batches have completed", "pipeline_batches_incomplete");
        }

        const closed = await client.query(
          "UPDATE jobs SET is_active = false, is_open = false, closed_at = COALESCE(closed_at, now()) " +
            "WHERE source = $1 AND is_active = true AND last_seen_at < $2",
          [input.source, run.started_at],
        );
        const completed = await client.query(
          "UPDATE pipeline_runs SET status = 'completed', completed_at = now(), error_message = NULL " +
            "WHERE id = $1 RETURNING id, discovered_count, inserted_count, updated_count",
          [run.id],
        );
        await client.query("COMMIT");
        response.status(201).json({
          idempotent: false,
          closed_count: closed.rowCount,
          run: completed.rows[0],
        });
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }),
  );

  return router;
}
