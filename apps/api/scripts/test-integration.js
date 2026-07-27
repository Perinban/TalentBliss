import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import pg from "pg";

const { Client } = pg;
const adminUrl = process.env.TEST_DATABASE_ADMIN_URL || "postgresql://localhost/postgres";
const databaseName = "talentbliss_test_" + process.pid + "_" + crypto.randomBytes(4).toString("hex");
const admin = new Client({ connectionString: adminUrl });

function databaseUrl(name) {
  const url = new URL(adminUrl);
  url.pathname = "/" + name;
  return url.toString();
}

await admin.connect();
let exitCode = 1;
try {
  await admin.query('CREATE DATABASE "' + databaseName + '"');
  const result = spawnSync(process.execPath, ["--test", "test/integration.test.js"], {
    cwd: new URL("..", import.meta.url),
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "test",
      DATABASE_URL: databaseUrl(databaseName),
    },
  });
  exitCode = result.status ?? 1;
} finally {
  await admin.query(
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1",
    [databaseName],
  );
  await admin.query('DROP DATABASE IF EXISTS "' + databaseName + '"');
  await admin.end();
}
process.exit(exitCode);
