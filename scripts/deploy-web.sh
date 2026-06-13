#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VPS_HOST="${VPS_HOST:-ubuntu@43.156.132.120}"
VPS_WEB_ROOT="${VPS_WEB_ROOT:-/var/www/hyphen/web}"

echo "→ Exporting web (API: https://api.hyphenjob.com)..."
mkdir -p node_modules/react-native-css-interop/.cache
EXPO_PUBLIC_API_BASE_URL=https://api.hyphenjob.com npx expo export -p web --clear

echo "→ App Store URLs: /privacy/ and /terms/"
mkdir -p dist/privacy dist/terms
cp dist/privacy.html dist/privacy/index.html
cp dist/terms.html dist/terms/index.html

echo "→ Hero background (fixed URL for static hosting)..."
mkdir -p dist/images
cp assets/images/hero-front-page.png dist/images/hero-front-page.png

TARBALL="$ROOT/hyphen-web-dist.tgz"
# macOS adds com.apple.provenance xattrs that Linux tar warns about on extract
COPYFILE_DISABLE=1 tar czf "$TARBALL" -C dist .
echo "→ Packed $(du -h "$TARBALL" | cut -f1) → $TARBALL"

if [[ "${1:-}" == "--upload" ]]; then
  echo "→ Uploading to $VPS_HOST:/tmp/"
  scp "$TARBALL" "$VPS_HOST:/tmp/hyphen-web-dist.tgz"
  echo "→ Extracting on VPS..."
  ssh "$VPS_HOST" "sudo mkdir -p '$VPS_WEB_ROOT' && sudo tar --warning=no-unknown-keyword xzf /tmp/hyphen-web-dist.tgz -C '$VPS_WEB_ROOT' && sudo chown -R ubuntu:ubuntu '$VPS_WEB_ROOT' 2>/dev/null || true && rm /tmp/hyphen-web-dist.tgz"
  echo "→ Verifying deploy..."
  ssh "$VPS_HOST" "test -f '$VPS_WEB_ROOT/images/hero-front-page.png' && test -f '$VPS_WEB_ROOT/index.html' && ls -lh '$VPS_WEB_ROOT/images/hero-front-page.png' '$VPS_WEB_ROOT/index.html'"
  echo "Done. Open https://hyphenjob.com"
else
  echo ""
  echo "Upload manually:"
  echo "  scp $TARBALL $VPS_HOST:/tmp/"
  echo "  ssh $VPS_HOST \"sudo mkdir -p $VPS_WEB_ROOT && sudo tar xzf /tmp/hyphen-web-dist.tgz -C $VPS_WEB_ROOT && rm /tmp/hyphen-web-dist.tgz\""
fi
