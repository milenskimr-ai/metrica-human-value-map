#!/usr/bin/env bash
# Installs a release built by GitHub Actions and restarts the app.
# Usage (as root):  ./install-release.sh metrica-hvm.tar.gz
# Keeps the last 5 releases; rolls back automatically if the health check fails.
set -euo pipefail

TARBALL="${1:?usage: $0 metrica-hvm.tar.gz}"
APP_DIR=/opt/metrica-hvm
SERVICE=metrica-hvm
PORT="$(grep -E '^PORT=' /etc/metrica-hvm/env | cut -d= -f2)"
PORT="${PORT:-3100}"

if [[ -f "$TARBALL.sha256" ]]; then
  (cd "$(dirname "$TARBALL")" && sha256sum -c "$(basename "$TARBALL").sha256")
fi

RELEASE="$APP_DIR/releases/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$RELEASE"
tar -xzf "$TARBALL" -C "$RELEASE"
chown -R root:root "$RELEASE"
chmod -R u=rwX,go=rX "$RELEASE"   # readable by the service user, writable only by root
# The only place the app may write: Next.js' cache directory
mkdir -p "$RELEASE/.next/cache"
chown -R "$SERVICE:$SERVICE" "$RELEASE/.next/cache"

PREVIOUS="$(readlink -f "$APP_DIR/current" 2>/dev/null || true)"

switch_to() {
  ln -sfn "$1" "$APP_DIR/current.new"
  mv -T "$APP_DIR/current.new" "$APP_DIR/current"
  systemctl restart "$SERVICE"
}

healthy() {
  for _ in $(seq 1 30); do
    if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  return 1
}

switch_to "$RELEASE"
if healthy; then
  echo "✔ $(cat "$RELEASE/REVISION" 2>/dev/null || basename "$RELEASE") is live and healthy"
  ls -1dt "$APP_DIR"/releases/* | tail -n +6 | xargs -r rm -rf
else
  echo "✘ Health check failed on port $PORT — see: journalctl -u $SERVICE -n 100"
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
    echo "Rolling back to $PREVIOUS"
    switch_to "$PREVIOUS"
  fi
  exit 1
fi
