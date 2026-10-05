#!/usr/bin/env bash
# Builds the complete PHP site for FTP upload:
#   dist/web/                 = exactly what goes into /web on the server
#   metrica-hvm-web.zip       = the same, zipped with no wrapping folder
# Node.js is only used here, at build time. Nothing on the server needs it.
set -euo pipefail
cd "$(dirname "$0")/.."

npx tsx scripts/export-php-rules.ts          # php/api/_lib/rules.json from config/*.ts + locales
npx next build                               # static HTML/CSS/JS → out/

rm -rf dist/web
mkdir -p dist/web
cp -r out/. dist/web/
cp -r php/api dist/web/api
git rev-parse --short HEAD > dist/web/api/_lib/revision.txt 2>/dev/null || echo "dev" > dist/web/api/_lib/revision.txt
find dist/web -name ".DS_Store" -delete
chmod -R u=rwX,go=rX dist/web

rm -f metrica-hvm-web.zip
(cd dist/web && zip -qr -X ../../metrica-hvm-web.zip .)
echo "Created metrica-hvm-web.zip ($(du -h metrica-hvm-web.zip | cut -f1), $(unzip -Z1 metrica-hvm-web.zip | grep -vc '/$') files) from dist/web/"
