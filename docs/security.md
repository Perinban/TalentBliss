# Security model

## Secrets

Real credentials never belong in this repository. Local examples contain placeholders only. Production values are split between the GitHub `production` environment and `/etc/talentbliss/api.env` on Oracle.

GitHub secrets:

- `ORACLE_SSH_PRIVATE_KEY`
- `DEPLOY_KNOWN_HOSTS`
- `PIPELINE_IMPORT_TOKEN`

Oracle-only values:

- `DATABASE_URL`
- `PIPELINE_IMPORT_TOKEN`
- future SMTP credentials

The pipeline token is dedicated to the internal import endpoints and must not be reused for user or deployment authentication. Google Drive credentials remain in the existing scraper/data-processing repositories and are not required by the TalentBliss application repository.

## Authentication

- Passwords are hashed with Argon2id.
- Session tokens are random and stored only as SHA-256 hashes.
- Production session cookies are Secure and HttpOnly.
- State-changing browser requests require a matching CSRF cookie/header pair.
- Request origins are restricted.
- Login and global request rate limits are applied.
- Role and record ownership are checked by the API, never trusted from the browser.

## Data access

- PostgreSQL listens on localhost only.
- GitHub Actions never receives `DATABASE_URL`.
- The Drive archive and Oracle import consume the same validated GitHub artifact; Drive credentials are unavailable to pull-request jobs.
- Resumes are stored outside the public frontend and require an authorized API request.
- External jobs retain their source URL and do not accept internal applications.
- Deleted recruiter jobs are soft-closed to preserve application history.

## Production host

The API binds to `127.0.0.1:3000` and is published through Cloudflare Tunnel. PostgreSQL binds to localhost. The public host should not expose ports 3000, 5432, or 111 through the Oracle security list or host firewall.

## Public repository checks

Before publishing or merging:

```bash
npm run lint
npm run test
npm run build
npm audit --omit=dev

git grep -nE '(BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|DATABASE_URL=.*@|PIPELINE_IMPORT_TOKEN=.{32})'
```

Secret scanning and push protection should be enabled in the GitHub repository settings. A credential exposed at any point must be rotated even after it is removed from Git history.

## Dependency audit status

Production dependencies must pass `npm audit --omit=dev`; the local release verification on July 26, 2026 reported zero runtime vulnerabilities. The full development audit still reports the `brace-expansion` denial-of-service advisory through the ESLint 9 toolchain (`eslint`/`eslint-plugin-react` → `minimatch` → `brace-expansion`). An incompatible override must not be used. Upgrade to ESLint 10 only when the React lint plugins resolve without a nested ESLint 9 tree and the complete lint/build suite passes.

## Known incomplete controls

Public registration should not be broadly enabled until email verification, password-reset delivery, abuse monitoring, and account-recovery procedures are implemented and tested.
