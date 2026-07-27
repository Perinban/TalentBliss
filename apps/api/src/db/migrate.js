import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../config/env.js";
import { createPool } from "./pool.js";

export const defaultMigrationsDirectory = fileURLToPath(
  new URL("../../../../database/migrations/", import.meta.url),
);

export async function runMigrations(pool, migrationsDirectory = defaultMigrationsDirectory) {
  await pool.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (" +
      "filename text PRIMARY KEY," +
      "applied_at timestamptz NOT NULL DEFAULT now()" +
      ")",
  );

  const filenames = (await fs.readdir(migrationsDirectory))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  for (const filename of filenames) {
    const existing = await pool.query(
      "SELECT 1 FROM schema_migrations WHERE filename = $1",
      [filename],
    );
    if (existing.rowCount) continue;

    const sql = await fs.readFile(path.join(migrationsDirectory, filename), "utf8");
    const client = await pool.connect();
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations(filename) VALUES ($1)",
        [filename],
      );
    } finally {
      client.release();
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = loadConfig();
  const pool = createPool(config.databaseUrl);
  try {
    await runMigrations(pool);
    console.log("Database migrations applied.");
  } finally {
    await pool.end();
  }
}
