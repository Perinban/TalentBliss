#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

: "${TALENTBLISS_DB_PASSWORD:?Set TALENTBLISS_DB_PASSWORD in the shell for this one-time command}"

database_name="${TALENTBLISS_DB_NAME:-talentbliss}"
database_user="${TALENTBLISS_DB_USER:-talentbliss}"

sudo -u postgres psql \
  --set=database_name="$database_name" \
  --set=database_user="$database_user" \
  --set=database_password="$TALENTBLISS_DB_PASSWORD" \
  --set=ON_ERROR_STOP=1 <<'SQL'
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', :'database_user', :'database_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'database_user') \gexec
SELECT format('ALTER ROLE %I PASSWORD %L', :'database_user', :'database_password') \gexec
SELECT format('CREATE DATABASE %I OWNER %I', :'database_name', :'database_user')
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = :'database_name') \gexec
SQL

unset TALENTBLISS_DB_PASSWORD
echo "Created or updated the local PostgreSQL role and database."
