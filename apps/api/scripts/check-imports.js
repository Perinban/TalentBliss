const modules = [
  "../src/app.js",
  "../src/config/env.js",
  "../src/db/migrate.js",
  "../src/db/pool.js",
  "../src/modules/auth/auth.routes.js",
  "../src/modules/companies/companies.routes.js",
  "../src/modules/jobs/jobs.routes.js",
  "../src/modules/applications/applications.routes.js",
  "../src/modules/internal/import.routes.js",
];

for (const modulePath of modules) {
  await import(modulePath);
}
console.log("API modules imported successfully.");
