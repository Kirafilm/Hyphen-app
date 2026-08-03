#!/usr/bin/env bash
# Run ON the VPS (after git pull) when Mac → VPS scp is unavailable.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

WEB_ROOT="${WEB_ROOT:-/var/www/hyphen/web}"

echo "→ Exporting web on VPS..."
mkdir -p node_modules/react-native-css-interop/.cache
EXPO_PUBLIC_API_BASE_URL="${EXPO_PUBLIC_API_BASE_URL:-https://api.hyphenjob.com}" npx expo export -p web --clear

echo "→ App Store URLs: /privacy/ and /terms/"
mkdir -p dist/privacy dist/terms
cp dist/privacy.html dist/privacy/index.html
cp dist/terms.html dist/terms/index.html

echo "→ Publisher files (ads.txt / app-ads.txt / robots / sitemap)"
for f in ads.txt app-ads.txt robots.txt sitemap.xml; do
  if [[ -f "public/$f" ]]; then
    cp "public/$f" "dist/$f"
  fi
done

echo "→ Installing to $WEB_ROOT ..."
sudo mkdir -p "$WEB_ROOT"
sudo rsync -a --delete dist/ "$WEB_ROOT/"
sudo chown -R ubuntu:ubuntu "$WEB_ROOT" 2>/dev/null || true

echo "→ Verify publisher files:"
head -1 "$WEB_ROOT/ads.txt" "$WEB_ROOT/app-ads.txt" 2>/dev/null || true
file -b --mime-type "$WEB_ROOT/ads.txt" "$WEB_ROOT/app-ads.txt" "$WEB_ROOT/robots.txt" 2>/dev/null || true

echo "→ Verify (host):"
ls -lh "$WEB_ROOT/images/hero-front-page.png" "$WEB_ROOT/index.html"
grep -o 'web-assets/hero-front-page.png' "$WEB_ROOT/index.html" | head -1 || {
  echo "WARN: index.html may still use old hero — run: bash scripts/patch-vps-hero.sh"
}

if command -v docker >/dev/null 2>&1 && [[ -f docker-compose.prod.yml ]]; then
  echo "→ Hero image served from API (not web root)."
fi

echo "Done. Test: curl -sI https://hyphenjob.com/images/hero-front-page.png | grep content-type"
