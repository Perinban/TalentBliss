# TalentBliss API

The API is the only component that accesses PostgreSQL. It provides first-party authentication, authorization, portal data, protected uploads, and the GitHub pipeline import endpoint.

## Modules

```text
src/config/             environment validation
src/db/                 PostgreSQL pool and migrations
src/lib/                cryptography, errors, uploads, utilities
src/middleware/         sessions, CSRF, origins, error handling
src/modules/auth/       registration, login, logout, role onboarding
src/modules/companies/  public listing and recruiter creation
src/modules/jobs/       public jobs, recruiter jobs, saved jobs
src/modules/applications/ candidate applications and protected resumes
src/modules/internal/   authenticated pipeline imports
```

## Local commands

```bash
npm run dev:api
npm run test:api
npm run build --workspace @talentbliss/api
npm run lint --workspace @talentbliss/api
```

`npm run test:api` creates and removes a temporary real PostgreSQL database. Set `TEST_DATABASE_ADMIN_URL` only when the local administrator connection is not `postgresql://localhost/postgres`.

## Production

The API should bind to `127.0.0.1`, read secrets from `/etc/talentbliss/api.env`, serve the built web directory, and be reached publicly only through Cloudflare Tunnel.
