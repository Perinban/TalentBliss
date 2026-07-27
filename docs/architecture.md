# Architecture

## Runtime boundary

TalentBliss uses GitHub as the distributed automation layer and Oracle as the durable application layer.

```text
Browser
  -> Cloudflare HTTPS
  -> TalentBliss API on Oracle
  -> PostgreSQL on localhost

GitHub Actions
  -> discover and split job URLs
  -> parallel scraper matrix
  -> combine and validate complete feed
  -> compressed authenticated API import
  -> PostgreSQL transaction
```

PostgreSQL is never exposed to GitHub or the public internet. The API and database communicate over localhost. The public frontend contains no database, session, pipeline, or deployment credentials.

## Applications

### Web

`apps/web` is a React/Vite single-page application. It supports anonymous job browsing and first-party candidate/recruiter accounts. Mutating API requests include the CSRF token issued with the authenticated session.

### API

`apps/api` is an Express application responsible for:

- authentication and sessions
- authorization and ownership checks
- companies and recruiter jobs
- saved jobs and candidate applications
- protected resume downloads
- pipeline imports
- serving the production frontend
- health checks

The API is the only application allowed to access PostgreSQL.

### Pipeline

`pipeline` is a Python package with one CLI. GitHub Actions performs discovery and scraping across matrix runners. A complete validated feed is gzip-compressed and sent once to the API. Partial matrix output is never used to close production jobs.

## Database rules

- `companies.slug` is unique.
- external `jobs.source_url` is unique.
- a candidate can save a job once.
- a candidate can apply to an internal job once.
- jobs are soft-closed instead of physically deleted.
- pipeline runs are identified by checksum and external run metadata.
- imports run in a database transaction.

## Release model

GitHub builds an immutable release archive. Oracle extracts releases under `/opt/talentbliss/releases/<commit>`, installs only API runtime dependencies, runs migrations, atomically switches `/opt/talentbliss/current`, restarts systemd, and rolls back if the local health check fails.

## Current limitations

- Email verification, password reset, and transactional email are not implemented.
- Existing Clerk and Supabase data are not migrated automatically.
- The Oracle server is not configured by these local changes until the bootstrap and deployment steps are explicitly executed.
