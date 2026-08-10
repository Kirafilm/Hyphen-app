#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VPS_HOST="${VPS_HOST:-ubuntu@43.156.132.120}"
VPS_WEB_ROOT="${VPS_WEB_ROOT:-/var/www/hyphen/web}"

echo "→ Exporting web (API: https://api.hyphenjob.com)..."
mkdir -p node_modules/react-native-css-interop/.cache
EXPO_PUBLIC_API_BASE_URL=https://api.hyphenjob.com npx expo export -p web --clear

echo "→ Clean URLs (/jobs, /post, /guides/post-job, …) + App Store /privacy/ /terms/"
# Flatten: dist/foo.html → dist/foo/index.html and dist/a/b.html → dist/a/b/index.html
while IFS= read -r -d '' html; do
  rel="${html#dist/}"
  base="${rel%.html}"
  case "$base" in
    index|+not-found|_sitemap) continue ;;
  esac
  # Skip files that are already directory indexes
  if [[ "$(basename "$html")" == "index.html" ]]; then
    continue
  fi
  mkdir -p "dist/$base"
  mv "$html" "dist/$base/index.html"
done < <(find dist -name '*.html' -print0)

echo "→ Publisher files (robots / sitemap)"
for f in robots.txt sitemap.xml; do
  if [[ -f "public/$f" ]]; then
    cp "public/$f" "dist/$f"
  fi
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
# Drop retired Google AdSense/AdMob publisher files if present from older deploys
sudo rm -f '$VPS_WEB_ROOT/ads.txt' '$VPS_WEB_ROOT/app-ads.txt'
sudo chown -R ubuntu:ubuntu '$VPS_WEB_ROOT' 2>/dev/null || true
rm -f /tmp/hyphen-web-dist.tgz
ls -lh '$VPS_WEB_ROOT/index.html' '$VPS_WEB_ROOT/jobs/index.html'
EOF
  echo "→ Verifying deploy..."
  ssh "$VPS_HOST" "grep -q '搜尋職位' '$VPS_WEB_ROOT/jobs/index.html' && grep -q 'Hyphen' '$VPS_WEB_ROOT/index.html' && grep -q '台灣接案' '$VPS_WEB_ROOT/tw/index.html'"
  echo "✓ jobs route + homepage + /tw Taiwan landing present"
  echo "Done. Open https://hyphenjob.com/jobs or https://hyphenjob.com/tw"
else
  echo ""
  echo "Upload manually:"
  echo "  scp $TARBALL $VPS_HOST:/tmp/"
  echo "  ssh $VPS_HOST \"sudo mkdir -p $VPS_WEB_ROOT && sudo tar -xzf /tmp/hyphen-web-dist.tgz -C $VPS_WEB_ROOT && sudo rm -f $VPS_WEB_ROOT/ads.txt $VPS_WEB_ROOT/app-ads.txt && rm -f /tmp/hyphen-web-dist.tgz\""
fi
