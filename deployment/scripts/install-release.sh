#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 RELEASE_ARCHIVE RELEASE_ID" >&2
  exit 2
fi

archive="$1"
release_id="$2"
root="${TALENTBLISS_ROOT:-/opt/talentbliss}"
release_dir="$root/releases/$release_id"
current_link="$root/current"
environment_file="${TALENTBLISS_ENV_FILE:-/etc/talentbliss/api.env}"
node_root="${TALENTBLISS_NODE_ROOT:-/opt/nodejs22}"
node_bin="$node_root/bin/node"
npm_bin="$node_root/bin/npm"
previous_target=""

if [[ ! -x "$node_bin" || ! -x "$npm_bin" ]]; then
  echo "Node.js 22 is not installed under $node_root." >&2
  exit 1
fi

if [[ -L "$current_link" ]]; then
  previous_target="$(readlink "$current_link")"
fi

install -d -o talentbliss -g talentbliss -m 0750 "$root/releases"
rm -rf "$release_dir"
install -d -o talentbliss -g talentbliss -m 0750 "$release_dir"
tar -xzf "$archive" -C "$release_dir"
chown -R talentbliss:talentbliss "$release_dir"

sudo -u talentbliss env \
  HOME=/var/lib/talentbliss \
  PATH="$node_root/bin:/usr/bin:/bin" \
  "$npm_bin" ci --omit=dev --workspace @talentbliss/api --prefix "$release_dir"

set -a
source "$environment_file"
set +a

sudo -u talentbliss env \
  HOME=/var/lib/talentbliss \
  PATH="$node_root/bin:/usr/bin:/bin" \
  DATABASE_URL="$DATABASE_URL" \
  "$node_bin" "$release_dir/apps/api/src/db/migrate.js"
ln -sfn "$release_dir" "$current_link"
systemctl restart talentbliss-api.service

if ! curl --fail --silent --show-error --retry 12 --retry-delay 2 --retry-connrefused http://127.0.0.1:3000/api/health; then
  echo "Health check failed; rolling back." >&2
  if [[ -n "$previous_target" ]]; then
    ln -sfn "$previous_target" "$current_link"
    systemctl restart talentbliss-api.service
  else
    systemctl stop talentbliss-api.service || true
    rm -f "$current_link"
  fi
  exit 1
fi

find "$root/releases" -mindepth 1 -maxdepth 1 -type d -print0 \
  | xargs -0 ls -1dt \
  | tail -n +6 \
  | xargs -r rm -rf

rm -f "$archive"
echo "Activated release $release_id"
