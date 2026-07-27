#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be configured}"

backup_dir="${TALENTBLISS_BACKUP_DIR:-/var/backups/talentbliss}"
retention_days="${TALENTBLISS_BACKUP_RETENTION_DAYS:-14}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
temporary_file="$backup_dir/.talentbliss-$timestamp.dump"
final_file="$backup_dir/talentbliss-$timestamp.dump"

install -d -m 0700 "$backup_dir"
pg_dump --dbname="$DATABASE_URL" --format=custom --compress=6 --file="$temporary_file"
chmod 0600 "$temporary_file"
mv "$temporary_file" "$final_file"
find "$backup_dir" -type f -name 'talentbliss-*.dump' -mtime "+$retention_days" -delete

echo "Created $final_file"
