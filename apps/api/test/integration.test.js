import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { loadConfig } from "../src/config/env.js";
import { runMigrations } from "../src/db/migrate.js";
import { createPool } from "../src/db/pool.js";

let app;
let pool;
let uploadDir;
const importToken = "integration-test-pipeline-token-1234567890";

function csrfToken(response) {
  const cookies = response.headers["set-cookie"] || [];
  const csrf = cookies.find((value) => value.startsWith("talentbliss_csrf="));
  assert.ok(csrf, "CSRF cookie was not set");
  return decodeURIComponent(csrf.split(";", 1)[0].split("=", 2)[1]);
}

before(async () => {
  uploadDir = await fs.mkdtemp(path.join(os.tmpdir(), "talentbliss-api-"));
  const config = loadConfig({
    NODE_ENV: "test",
    DATABASE_URL: process.env.DATABASE_URL,
    WEB_ORIGIN: "http://localhost:5173",
    UPLOAD_DIR: uploadDir,
    PIPELINE_IMPORT_TOKEN: importToken,
  });
  pool = createPool(config.databaseUrl);
  await runMigrations(pool);
  app = createApp({ pool, config });
});

after(async () => {
  await pool.end();
  await fs.rm(uploadDir, { recursive: true, force: true });
});

test("complete portal and pipeline flow", async () => {
  await request(app).get("/api/health").expect(200, { status: "ok" });

  const recruiter = request.agent(app);
  const recruiterRegister = await recruiter
    .post("/api/auth/register")
    .send({
      email: "recruiter@example.com",
      password: "Correct-Horse-Battery-42",
      firstName: "Rita",
      lastName: "Recruiter",
    })
    .expect(201);
  let recruiterCsrf = csrfToken(recruiterRegister);
  assert.equal(recruiterRegister.body.user.role, null);

  const recruiterRole = await recruiter
    .patch("/api/auth/role")
    .set("x-csrf-token", recruiterCsrf)
    .send({ role: "recruiter" })
    .expect(200);
  assert.equal(recruiterRole.body.user.role, "recruiter");

  const company = await recruiter
    .post("/api/companies")
    .set("x-csrf-token", recruiterCsrf)
    .field("name", "Example Engineering")
    .attach("logo", Buffer.from([0x89, 0x50, 0x4e, 0x47]), {
      filename: "logo.png",
      contentType: "image/png",
    })
    .expect(201);
  assert.equal(company.body.slug, "example-engineering");

  const createdJob = await recruiter
    .post("/api/jobs")
    .set("x-csrf-token", recruiterCsrf)
    .send({
      title: "Backend Engineer",
      description: "Build and maintain production backend services.",
      requirements: "Node.js and PostgreSQL",
      country: "DE",
      state: "BE",
      company_id: company.body.id,
      mode: "Hybrid",
      domain: "Software Engineering",
      salary: "EUR 70000",
    })
    .expect(201);
  const jobId = createdJob.body.id;

  const candidate = request.agent(app);
  const candidateRegister = await candidate
    .post("/api/auth/register")
    .send({
      email: "candidate@example.com",
      password: "Another-Secure-Password-42",
      firstName: "Casey",
      lastName: "Candidate",
    })
    .expect(201);
  const candidateCsrf = csrfToken(candidateRegister);
  await candidate
    .patch("/api/auth/role")
    .set("x-csrf-token", candidateCsrf)
    .send({ role: "candidate" })
    .expect(200);

  const listing = await candidate.get("/api/jobs?searchQuery=Backend").expect(200);
  assert.equal(listing.body.total, 1);
  assert.equal(listing.body.jobs[0].id, jobId);

  const saved = await candidate
    .put("/api/jobs/" + jobId + "/saved")
    .set("x-csrf-token", candidateCsrf)
    .send({ saved: true })
    .expect(200);
  assert.equal(saved.body.length, 1);
  const savedJobs = await candidate.get("/api/jobs/saved").expect(200);
  assert.equal(savedJobs.body[0].job.id, jobId);

  const application = await candidate
    .post("/api/applications/jobs/" + jobId)
    .set("x-csrf-token", candidateCsrf)
    .field("first_name", "Casey")
    .field("last_name", "Candidate")
    .field("mobile_number", "+491234567")
    .field("country", "Germany")
    .field("address", "Berlin")
    .field("higher_education", "graduate")
    .field("passed_out_year", "2022")
    .field("languages_known", "English, German")
    .field("skills", "Node.js, PostgreSQL")
    .field("experience_years", "3")
    .field("gender", "other")
    .field("career_level", "experienced")
    .field("expected_salary", "70000")
    .attach("resume", Buffer.from("%PDF-1.4 test"), {
      filename: "resume.pdf",
      contentType: "application/pdf",
    })
    .expect(201);
  const applicationId = application.body.id;

  const recruiterJob = await recruiter.get("/api/jobs/" + jobId).expect(200);
  assert.equal(recruiterJob.body.application_count, 1);
  assert.equal(recruiterJob.body.applications[0].id, applicationId);

  await recruiter
    .patch("/api/applications/" + applicationId + "/status")
    .set("x-csrf-token", recruiterCsrf)
    .send({ status: "interviewing" })
    .expect(200);
  const candidateApplications = await candidate.get("/api/applications/mine").expect(200);
  assert.equal(candidateApplications.body[0].status, "interviewing");

  const importedFeed = {
    source: "join",
    runId: "1001",
    runAttempt: "1",
    complete: true,
    jobs: [
      {
        Company_Name: "Imported Company",
        Company_Logo_Url: null,
        Job_URL: "https://join.com/companies/imported/jobs/123",
        Job_Title: "Imported Data Engineer",
        Job_Location: "Remote",
        Job_Status: "FULL_TIME",
        Job_Domain: "Data",
        Job_Salary: null,
        Job_Details: [{ header: "Description", content: "Build reliable data pipelines." }],
        Last_Updated: "2026-07-26T00:00:00Z",
        reject_reason: null,
      },
    ],
  };
  const firstImport = await request(app)
    .post("/api/internal/imports/jobs")
    .set("authorization", "Bearer " + importToken)
    .send(importedFeed)
    .expect(201);
  assert.equal(firstImport.body.idempotent, false);
  assert.equal(firstImport.body.deleted_count, 0);
  assert.equal(firstImport.body.deleted_company_count, 0);
  assert.equal(firstImport.body.run.inserted_count, 1);

  const repeatedImport = await request(app)
    .post("/api/internal/imports/jobs")
    .set("authorization", "Bearer " + importToken)
    .send(importedFeed)
    .expect(200);
  assert.equal(repeatedImport.body.idempotent, true);

  const retryUrl = "https://join.com/companies/imported/jobs/retry";
  const failedFeed = {
    ...importedFeed,
    runId: "1002",
    jobs: [
      { ...importedFeed.jobs[0], Job_URL: retryUrl },
      { ...importedFeed.jobs[0], Job_URL: retryUrl, Job_Title: "Duplicate staging row" },
    ],
  };
  await request(app)
    .post("/api/internal/imports/jobs")
    .set("authorization", "Bearer " + importToken)
    .send(failedFeed)
    .expect(409);

  const failedRun = await pool.query(
    "SELECT status, error_message FROM pipeline_runs WHERE external_run_id = $1",
    ["1002"],
  );
  assert.equal(failedRun.rows[0].status, "failed");
  assert.match(failedRun.rows[0].error_message, /duplicate key/i);
  const rolledBackJob = await pool.query("SELECT id FROM jobs WHERE source_url = $1", [retryUrl]);
  assert.equal(rolledBackJob.rowCount, 0);

  const retryFeed = {
    ...importedFeed,
    runId: "1002",
    jobs: [{ ...importedFeed.jobs[0], Job_URL: retryUrl, Job_Title: "Retried Data Engineer" }],
  };
  const retryImport = await request(app)
    .post("/api/internal/imports/jobs")
    .set("authorization", "Bearer " + importToken)
    .send(retryFeed)
    .expect(201);
  assert.equal(retryImport.body.idempotent, false);
  assert.equal(retryImport.body.run.inserted_count, 1);

  const completedRetry = await pool.query(
    "SELECT status, error_message FROM pipeline_runs WHERE external_run_id = $1",
    ["1002"],
  );
  assert.equal(completedRetry.rows[0].status, "completed");
  assert.equal(completedRetry.rows[0].error_message, null);

  const importedListing = await candidate.get("/api/jobs?searchQuery=Retried").expect(200);
  assert.equal(importedListing.body.total, 1);

  const batchJobA = {
    ...importedFeed.jobs[0],
    Company_Name: "Batched Company A",
    Job_URL: "https://join.com/companies/batched/jobs/a",
    Job_Title: "Batched Engineer A",
  };
  const batchJobB = {
    ...importedFeed.jobs[0],
    Company_Name: "Batched Company B",
    Job_URL: "https://join.com/companies/batched/jobs/b",
    Job_Title: "Batched Engineer B",
  };
  const firstBatchPayload = {
    source: "join-batch",
    runId: "batch-1001",
    runAttempt: "1",
    batchIndex: 0,
    batchCount: 2,
    jobs: [batchJobA],
  };
  const firstBatch = await request(app)
    .post("/api/internal/imports/jobs/batches")
    .set("authorization", "Bearer " + importToken)
    .send(firstBatchPayload)
    .expect(201);
  assert.equal(firstBatch.body.idempotent, false);
  assert.equal(firstBatch.body.batch.inserted_count, 1);

  const repeatedBatch = await request(app)
    .post("/api/internal/imports/jobs/batches")
    .set("authorization", "Bearer " + importToken)
    .send(firstBatchPayload)
    .expect(200);
  assert.equal(repeatedBatch.body.idempotent, true);

  await request(app)
    .post("/api/internal/imports/jobs/finalize")
    .set("authorization", "Bearer " + importToken)
    .send({ source: "join-batch", runId: "batch-1001", runAttempt: "1", batchCount: 2 })
    .expect(409);

  await request(app)
    .post("/api/internal/imports/jobs/batches")
    .set("authorization", "Bearer " + importToken)
    .send({ ...firstBatchPayload, batchIndex: 1, jobs: [batchJobB] })
    .expect(201);

  const finalizedBatchRun = await request(app)
    .post("/api/internal/imports/jobs/finalize")
    .set("authorization", "Bearer " + importToken)
    .send({ source: "join-batch", runId: "batch-1001", runAttempt: "1", batchCount: 2 })
    .expect(201);
  assert.equal(finalizedBatchRun.body.idempotent, false);
  assert.equal(finalizedBatchRun.body.run.discovered_count, 2);

  const repeatedFinalize = await request(app)
    .post("/api/internal/imports/jobs/finalize")
    .set("authorization", "Bearer " + importToken)
    .send({ source: "join-batch", runId: "batch-1001", runAttempt: "1", batchCount: 2 })
    .expect(200);
  assert.equal(repeatedFinalize.body.idempotent, true);

  const secondBatchRun = {
    source: "join-batch",
    runId: "batch-1002",
    runAttempt: "1",
    batchIndex: 0,
    batchCount: 1,
    jobs: [{ ...batchJobA, Job_Title: "Batched Engineer A Updated" }],
  };
  await request(app)
    .post("/api/internal/imports/jobs/batches")
    .set("authorization", "Bearer " + importToken)
    .send(secondBatchRun)
    .expect(201);
  const secondFinalize = await request(app)
    .post("/api/internal/imports/jobs/finalize")
    .set("authorization", "Bearer " + importToken)
    .send({ source: "join-batch", runId: "batch-1002", runAttempt: "1", batchCount: 1 })
    .expect(201);
  assert.equal(secondFinalize.body.deleted_count, 1);
  assert.equal(secondFinalize.body.deleted_company_count, 1);

  const batchJobs = await pool.query(
    "SELECT source_url, title, is_active FROM jobs WHERE source = $1 ORDER BY source_url",
    ["join-batch"],
  );
  assert.equal(batchJobs.rowCount, 1);
  assert.equal(batchJobs.rows[0].title, "Batched Engineer A Updated");
  assert.equal(batchJobs.rows[0].is_active, true);

  const deletedCompany = await pool.query("SELECT id FROM companies WHERE slug = $1", ["batched-company-b"]);
  assert.equal(deletedCompany.rowCount, 0);

  await candidate
    .post("/api/auth/logout")
    .set("x-csrf-token", candidateCsrf)
    .expect(204);
  await candidate.get("/api/applications/mine").expect(401);
});
