#!/usr/bin/env bash
# Packages the app for hosts without SSH (ISPConfig + FTP): metrica-hvm-ispconfig.zip
# The zip's contents sit at its top level (no wrapping folder): unzip it locally,
# fill in hvm-settings.env, and upload everything into the app folder via FTP.
# Run after `npm run build` (needs output: "standalone").
set -euo pipefail
OUT="$(mktemp -d)"
cp -r .next/standalone/. "$OUT/"                 # server.js, package.json, minimal node_modules, compiled .next/server
mkdir -p "$OUT/.next"
cp -r .next/static "$OUT/.next/static"           # browser JS/CSS (not part of the standalone copy)
[[ -d public ]] && cp -r public "$OUT/public"
find "$OUT" -maxdepth 1 -name ".env*" -delete    # never ship a developer's settings
cp deploy/ispconfig/start.js "$OUT/start.js"
cp deploy/ispconfig/hvm-settings.env.template "$OUT/hvm-settings.env"
git rev-parse --short HEAD > "$OUT/REVISION" 2>/dev/null || true
chmod -R u=rwX,go=rX "$OUT"
rm -f metrica-hvm-ispconfig.zip
(cd "$OUT" && zip -qr -X "$OLDPWD/metrica-hvm-ispconfig.zip" .)
rm -rf "$OUT"
echo "Created metrica-hvm-ispconfig.zip ($(du -h metrica-hvm-ispconfig.zip | cut -f1), $(unzip -Z1 metrica-hvm-ispconfig.zip | grep -vc '/$') files)"
