#!/usr/bin/env bash
# Packages the standalone Next.js build into metrica-hvm.tar.gz (used by CI).
set -euo pipefail
OUT="$(mktemp -d)"
cp -r .next/standalone/. "$OUT/"
mkdir -p "$OUT/.next"
cp -r .next/static "$OUT/.next/static"
[[ -d public ]] && cp -r public "$OUT/public"
# Never ship environment files — secrets live only in /etc/metrica-hvm/env on the server
find "$OUT" -maxdepth 1 -name ".env*" -delete
git rev-parse --short HEAD > "$OUT/REVISION" 2>/dev/null || true
# mktemp creates a private (700) directory — make the release world-readable, not writable
chmod -R u=rwX,go=rX "$OUT"
tar -czf metrica-hvm.tar.gz -C "$OUT" .
sha256sum metrica-hvm.tar.gz > metrica-hvm.tar.gz.sha256
rm -rf "$OUT"
echo "Created metrica-hvm.tar.gz ($(du -h metrica-hvm.tar.gz | cut -f1))"
