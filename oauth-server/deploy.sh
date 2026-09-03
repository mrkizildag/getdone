#!/usr/bin/env bash
# Ships the relay to a host running the getdone-oauth systemd unit.
#
#   ./deploy.sh mrk@arch-box
#
# Copies the two source files, restarts the service and verifies it came back.
# The environment file holding the client secret is never touched: it lives on
# the host only, and nothing here should be able to overwrite it.
set -euo pipefail

HOST="${1:-}"
REMOTE_DIR="${2:-/srv/getdone-oauth}"

if [[ -z "$HOST" ]]; then
  echo "usage: $0 user@host [remote-dir]" >&2
  exit 2
fi

cd "$(dirname "$0")"

echo "==> syncing to $HOST:$REMOTE_DIR"
rsync -av --checksum server.mjs lib.mjs "$HOST:/tmp/getdone-oauth-staging/"

# shellcheck disable=SC2029
ssh "$HOST" "set -euo pipefail
  sudo install -d -m 0755 '$REMOTE_DIR'
  sudo install -m 0644 /tmp/getdone-oauth-staging/server.mjs '$REMOTE_DIR/server.mjs'
  sudo install -m 0644 /tmp/getdone-oauth-staging/lib.mjs '$REMOTE_DIR/lib.mjs'
  rm -rf /tmp/getdone-oauth-staging
  sudo systemctl restart getdone-oauth
  sleep 1
  sudo systemctl is-active --quiet getdone-oauth
"

echo "==> service is active"
echo "    now run: ./verify.sh https://your-host"
