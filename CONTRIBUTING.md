# Contributing

## Development

1. Install Node.js 22, Python 3.11+, and PostgreSQL 17.
2. Copy `.env.example` to `.env` and use local-only credentials.
3. Run `npm install` and `python3 -m pip install -e pipeline`.
4. Create a PostgreSQL database named `talentbliss`.
5. Run the API and web development servers from separate terminals.

## Required checks

Before opening a pull request:

```bash
npm run lint
npm run test:api
npm run test:pipeline
npm run build
npm audit --omit=dev
```

Do not weaken tests, disable security middleware, or suppress lint rules merely to make a change pass.

## Database changes

- Add a new ordered SQL file under `database/migrations`.
- Never rewrite a migration that may already have run in another environment.
- Add or update a PostgreSQL integration test.
- Preserve application and saved-job history when changing job lifecycle behavior.

## API changes

- Validate input with Zod.
- Apply authentication, role, and ownership checks on the server.
- Do not expose filesystem paths, password hashes, session tokens, or database errors.
- Add integration coverage for new account or data workflows.

## Pipeline changes

- Keep output deterministic.
- Do not import partial matrix results as a complete feed.
- Preserve idempotency by stable source URLs and run metadata.
- Keep request concurrency bounded and respectful of source websites.

## Secrets

Never commit `.env`, private keys, database dumps, resumes, service-account files, or production artifacts. Use placeholders in examples. If a credential is exposed, rotate it immediately and report it privately.

## Commits

Keep commits focused and explain schema, API, or workflow behavior changes clearly. Do not commit generated `node_modules`, frontend builds, pipeline artifacts, uploads, or database backups.
