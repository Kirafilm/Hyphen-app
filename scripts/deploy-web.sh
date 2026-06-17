#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VPS_HOST="${VPS_HOST:-ubuntu@43.156.132.120}"
VPS_WEB_ROOT="${VPS_WEB_ROOT:-/var/www/hyphen/web}"

echo "→ Exporting web (API: https://api.hyphenjob.com)..."
mkdir -p node_modules/react-native-css-interop/.cache
EXPO_PUBLIC_API_BASE_URL=https://api.hyphenjob.com npx expo export -p web --clear

echo "→ Clean URLs (/jobs, /post, …) + App Store /privacy/ /terms/"
for html in dist/*.html; do
  base="$(basename "$html" .html)"
  case "$base" in
    index|+not-found|_sitemap) continue ;;
  esac
  mkdir -p "dist/$base"
  cp "$html" "dist/$base/index.html"
done

TARBALL="$ROOT/hyphen-web-dist.tgz"
# macOS adds com.apple.provenance xattrs that Linux tar warns about on extract
COPYFILE_DISABLE=1 tar czf "$TARBALL" -C dist .
echo "→ Packed $(du -h "$TARBALL" | cut -f1) → $TARBALL"

if [[ "${1:-}" == "--upload" ]]; then
  echo "→ Uploading to $VPS_HOST:/tmp/"
  scp "$TARBALL" "$VPS_HOST:/tmp/hyphen-web-dist.tgz"
  echo "→ Extracting on VPS..."
  ssh "$VPS_HOST" "bash -s" <<EOF
set -euo pipefail
sudo mkdir -p '$VPS_WEB_ROOT'
# NOTE: must be -xzf (with dash). "tar ... xzf" treats xzf as a filename on GNU tar.
sudo tar -xzf /tmp/hyphen-web-dist.tgz -C '$VPS_WEB_ROOT'
sudo chown -R ubuntu:ubuntu '$VPS_WEB_ROOT' 2>/dev/null || true
rm -f /tmp/hyphen-web-dist.tgz
ls -lh '$VPS_WEB_ROOT/index.html' '$VPS_WEB_ROOT/jobs/index.html'
EOF
  echo "→ Verifying deploy..."
  ssh "$VPS_HOST" "grep -q '搜尋職位' '$VPS_WEB_ROOT/jobs/index.html' && grep -q 'Hyphen' '$VPS_WEB_ROOT/index.html'"
  echo "✓ jobs route + homepage content present"
  echo "Done. Open https://hyphenjob.com/jobs"
else
  echo ""
  echo "Upload manually:"
  echo "  scp $TARBALL $VPS_HOST:/tmp/"
  echo "  ssh $VPS_HOST \"sudo mkdir -p $VPS_WEB_ROOT && sudo tar -xzf /tmp/hyphen-web-dist.tgz -C $VPS_WEB_ROOT && rm -f /tmp/hyphen-web-dist.tgz\""
fi
