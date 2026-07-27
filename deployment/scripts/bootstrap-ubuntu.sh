#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive
export NEEDRESTART_MODE=a

if [[ ${EUID} -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

apt-get update
apt-get install -y ca-certificates curl gnupg postgresql-common xz-utils

if [[ ! -x /opt/nodejs22/bin/node ]]; then
  case "$(dpkg --print-architecture)" in
    arm64) node_arch="arm64" ;;
    amd64) node_arch="x64" ;;
    *)
      echo "Unsupported Node.js architecture: $(dpkg --print-architecture)" >&2
      exit 1
      ;;
  esac
  curl --fail --silent --show-error \
    https://nodejs.org/dist/index.tab \
    --output /tmp/talentbliss-node-index.tab
  node_version="$(awk 'NR > 1 && $1 ~ /^v22\./ { print $1; exit }' /tmp/talentbliss-node-index.tab)"
  rm -f /tmp/talentbliss-node-index.tab
  [[ -n "$node_version" ]]
  archive="node-${node_version}-linux-${node_arch}.tar.xz"
  curl --fail --location --silent --show-error \
    "https://nodejs.org/dist/${node_version}/${archive}" \
    --output "/tmp/${archive}"
  rm -rf /opt/nodejs22.new
  install -d -m 0755 /opt/nodejs22.new
  tar -xJf "/tmp/${archive}" --strip-components=1 -C /opt/nodejs22.new
  mv /opt/nodejs22.new /opt/nodejs22
  rm -f "/tmp/${archive}"
fi
/opt/nodejs22/bin/node --version
/opt/nodejs22/bin/npm --version
install -d -m 0755 /usr/share/postgresql-common/pgdg
curl --fail --silent --show-error \
  https://www.postgresql.org/media/keys/ACCC4CF8.asc \
  | gpg --dearmor --yes --output /usr/share/postgresql-common/pgdg/apt.postgresql.org.gpg
. /etc/os-release
echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.gpg] https://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" \
  > /etc/apt/sources.list.d/pgdg.list
apt-get update
apt-get install -y postgresql-17 postgresql-client-17

if ! id talentbliss >/dev/null 2>&1; then
  useradd --system --home /var/lib/talentbliss --create-home --shell /usr/sbin/nologin talentbliss
fi

install -d -o talentbliss -g talentbliss -m 0750 \
  /opt/talentbliss/releases \
  /var/lib/talentbliss/uploads \
  /var/backups/talentbliss
install -d -o root -g talentbliss -m 0750 /etc/talentbliss

install -m 0644 "$repo_root/deployment/systemd/talentbliss-api.service" /etc/systemd/system/
install -m 0644 "$repo_root/deployment/systemd/talentbliss-backup.service" /etc/systemd/system/
install -m 0644 "$repo_root/deployment/systemd/talentbliss-backup.timer" /etc/systemd/system/
chmod 0755 "$repo_root/deployment/scripts/"*.sh
systemctl daemon-reload
systemctl enable talentbliss-api.service talentbliss-backup.timer

sudo -u postgres psql -v ON_ERROR_STOP=1 <<'SQL'
ALTER SYSTEM SET listen_addresses = 'localhost';
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
SQL
systemctl restart postgresql

echo "Bootstrap complete. Create the database and /etc/talentbliss/api.env before deploying."
