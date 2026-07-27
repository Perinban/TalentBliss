# TalentBliss

TalentBliss is a self-hosted job portal with a public, reproducible monorepo. GitHub provides source control, CI, parallel scraping, release artifacts, and controlled deployment. The production website, API, authentication, uploads, and PostgreSQL database run on the Oracle server.

## Architecture

```text
GitHub Actions                         Oracle server
-----------------------------          -----------------------------
CI, tests, builds                      React production assets
parallel JOIN scraping       ----->    Node.js API on 127.0.0.1:3000
validated feed artifacts               PostgreSQL on localhost:5432
protected release deploy               server-managed user sessions
                                       Cloudflare Tunnel
```

GitHub never connects directly to PostgreSQL. The scraper sends one compressed, authenticated, idempotent feed to the internal import endpoint after every matrix shard and the combine stage succeed.

## Repository layout

```text
apps/
  web/                  React/Vite frontend
  api/                  Express API and self-hosted authentication
database/
  migrations/           versioned PostgreSQL schema
pipeline/               Python JOIN scraper and API publisher
deployment/
  scripts/              bootstrap, backup, atomic release installer
  systemd/              production service and timer units
docs/                   architecture, security, and deployment guides
.github/workflows/       CI, scraper, and protected production release
```

## Local requirements

- Node.js 22 or newer
- npm
- Python 3.11 or newer
- PostgreSQL 17

## Local setup

```bash
cp .env.example .env
createdb talentbliss
npm install
python3 -m pip install -e pipeline
npm run dev:api
```

In a second terminal:

```bash
npm run dev:web
```

The Vite development server proxies `/api` to `127.0.0.1:3000`.

## Verification

```bash
npm run lint
npm run test:api
npm run test:pipeline
npm run build
```

The API integration test creates a temporary real PostgreSQL database and verifies registration, role onboarding, recruiter job creation, candidate saving and applying, application-status updates, protected sessions, and idempotent pipeline imports.

## Authentication

TalentBliss no longer requires Clerk. Authentication uses:

- Argon2id password hashes
- opaque random session tokens
- hashed session tokens in PostgreSQL
- Secure/HttpOnly cookies in production
- CSRF tokens and origin checks
- role and ownership authorization in the API

Email verification and password-reset delivery are not implemented yet. They should be completed before opening unrestricted public registration.

## Data

TalentBliss no longer requires Supabase. PostgreSQL owns users, companies, jobs, saved jobs, applications, sessions, and pipeline audit history. Existing Clerk/Supabase production records have not yet been migrated; migration tooling must be prepared from an authoritative export before decommissioning either service.

## GitHub configuration

Public pull requests receive no production secrets. The optional protected `production` environment uses:

Variables:

```text
ENABLE_ORACLE_DEPLOY
ORACLE_HOST
ORACLE_USER
TALENTBLISS_API_URL
```

Secrets:

```text
ORACLE_SSH_PRIVATE_KEY
DEPLOY_KNOWN_HOSTS
PIPELINE_IMPORT_TOKEN
```

The established production data flow remains in `Perinban/join_companies`, `Perinban/WebScrapJobs`, and `Perinban/job-data-processing`. Google Drive credentials stay in the scraper/data-processing repositories; TalentBliss receives only authenticated, validated job batches.

## Documentation

- `docs/architecture.md`
- `docs/security.md`
- `docs/deployment.md`
- `CONTRIBUTING.md`
- `SECURITY.md`

No Oracle deployment is performed merely by cloning or testing this repository. Production jobs remain disabled until the corresponding GitHub environment variables are explicitly enabled.

## License

TalentBliss is licensed under the MIT License. See `LICENSE`.
