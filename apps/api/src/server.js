import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { runMigrations } from "./db/migrate.js";
import { createPool } from "./db/pool.js";

const config = loadConfig();
const pool = createPool(config.databaseUrl);

await runMigrations(pool);
const app = createApp({ pool, config });
const server = app.listen(config.port, config.host, () => {
  console.log("TalentBliss API listening on " + config.host + ":" + config.port);
});

async function shutdown(signal) {
  console.log("Received " + signal + ", shutting down.");
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
