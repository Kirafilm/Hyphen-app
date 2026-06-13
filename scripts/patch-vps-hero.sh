#!/usr/bin/env bash
# Patch live static HTML on VPS — no expo export, no scp.
# Prerequisite: API serves https://api.hyphenjob.com/web-assets/hero-front-page.png
set -euo pipefail

WEB_ROOT="${WEB_ROOT:-/var/www/hyphen/web}"
HERO_URL="${HERO_URL:-https://api.hyphenjob.com/web-assets/hero-front-page.png}"

echo "→ Checking API image..."
curl -sfI "$HERO_URL" | grep -qi 'image/png' || {
  echo "ERROR: $HERO_URL is not image/png — run: docker compose -f docker-compose.prod.yml up -d --build api"
  exit 1
}

OLD='background-image:linear-gradient(135deg, #7C67FF 0%, #5B45E8 50%, #4528D4 100%)'
NEW="background-image:linear-gradient(135deg, rgba(124,103,255,0.84) 0%, rgba(91,69,232,0.8) 48%, rgba(69,40,212,0.76) 100%), url(${HERO_URL});background-size:cover;background-position:center"

count=0
while IFS= read -r file; do
  sudo sed -i "s|${OLD}|${NEW}|g" "$file"
  echo "  patched $file"
  count=$((count + 1))
done < <(grep -rl "$OLD" "$WEB_ROOT" --include='*.html' 2>/dev/null || true)

if [[ "$count" -eq 0 ]]; then
  echo "No old hero gradient found (maybe already updated)."
else
  echo "Patched $count HTML file(s). Open https://hyphenjob.com"
fi
