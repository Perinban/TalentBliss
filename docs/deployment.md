# Oracle deployment

These files prepare deployment but do not modify the server until commands are run explicitly.

## Server prerequisites

- Ubuntu 22.04 ARM64
- Outbound HTTPS access for package installation
- Cloudflare Tunnel
- sudo access

## One-time bootstrap

Clone the repository to a temporary working directory on Oracle, review the script, and run:

```bash
sudo deployment/scripts/bootstrap-ubuntu.sh
```

The script installs Node.js 22 under `/opt/nodejs22` without replacing an existing system Node installation, installs PostgreSQL 17 from the PostgreSQL Apt repository, creates the `talentbliss` service account and directories, installs systemd units, and forces PostgreSQL to listen on localhost.

Create the database with a password supplied only to the current shell:

```bash
sudo TALENTBLISS_DB_PASSWORD='replace-me' \
  deployment/scripts/create-database.sh
```

Create `/etc/talentbliss/api.env` with owner `root:talentbliss` and mode `0640`:

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=3000
DATABASE_URL=postgresql://talentbliss:URL_ENCODED_PASSWORD@127.0.0.1:5432/talentbliss
WEB_ORIGIN=https://your-public-domain.example
SESSION_TTL_HOURS=168
UPLOAD_DIR=/var/lib/talentbliss/uploads
WEB_DIST_DIR=/opt/talentbliss/current/apps/web/dist
PIPELINE_IMPORT_TOKEN=generate-a-separate-random-token
TRUST_PROXY=true
```

Do not copy the sample password or import token into production.

## systemd

Enable and start the application service after the first release:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now talentbliss-api.service
```

Useful checks:

```bash
systemctl status talentbliss-api.service
journalctl -u talentbliss-api.service -n 100 --no-pager
curl --fail http://127.0.0.1:3000/api/health
```

## Cloudflare

Point the existing tunnel hostname to:

```text
http://127.0.0.1:3000
```

The API serves both `/api/*` and the built React application. Port 3000 should not be reachable directly from the internet.

## GitHub production environment

Create a protected environment named `production`.

Variables:

```text
ENABLE_ORACLE_DEPLOY=true
ORACLE_HOST=<server address>
ORACLE_USER=ubuntu
TALENTBLISS_API_URL=https://your-public-domain.example
```

Secrets:

```text
ORACLE_SSH_PRIVATE_KEY
DEPLOY_KNOWN_HOSTS
PIPELINE_IMPORT_TOKEN
```

`DEPLOY_KNOWN_HOSTS` should contain a verified host-key line collected out of band. Do not disable SSH host-key verification.

## Pipeline publishing behavior

The established pipeline is maintained in three repositories: `Perinban/join_companies`, `Perinban/WebScrapJobs`, and `Perinban/job-data-processing`. The scraper archives the combined feed in Google Drive. The data-processing repository downloads that feed, filters invalid records, deduplicates source URLs, enforces a minimum-job safety threshold, and sends bounded gzip batches to TalentBliss. Oracle records each completed batch, and missing imported jobs are deleted only after an explicit finalize request confirms that every expected batch arrived. Imported companies with no remaining jobs are deleted in the same transaction.

## Release behavior

The deployment workflow:

1. checks out the exact tested commit;
2. runs lint, PostgreSQL integration tests, pipeline tests, and builds;
3. creates an immutable archive;
4. uploads the archive as a GitHub artifact;
5. copies it to Oracle through SSH;
6. installs API runtime dependencies in a versioned release directory;
7. runs database migrations;
8. switches the `current` symlink atomically;
9. restarts the API;
10. rolls back if `/api/health` fails.

## Backups

The nightly timer creates PostgreSQL custom-format dumps in `/var/backups/talentbliss` and retains 14 days by default. A backup on the same server is not sufficient disaster recovery; copy encrypted backups to a separate storage location before production use.

## Existing services

Before deployment, inspect the current Node process on port 3000, the Cloudflare Tunnel configuration, Oracle network security lists, and rpcbind on port 111. Do not replace or disable existing services without confirming their purpose.
