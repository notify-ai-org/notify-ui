#!/usr/bin/env bash
# =============================================================================
# build-all.sh
#
# Builds the shared @notify-ui/shared library and all microfrontend portals,
# then copies each portal's dist/ into the Spring Boot static resource folder:
#   access/src/main/resources/static/portals/<name>/
#
# Usage:
#   ./notify-ui/build-all.sh                  # build everything
#   ./notify-ui/build-all.sh --skip-shared    # skip rebuilding shared library
#   ./notify-ui/build-all.sh --portal events  # build only one portal
#
# Exit codes:
#   0  success
#   1  one or more builds failed
# =============================================================================
set -euo pipefail

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SHARED_DIR="$SCRIPT_DIR/shared"
STATIC_OUT="$ROOT_DIR/access/src/main/resources/static/portals"

# ── Portal registry ───────────────────────────────────────────────────────────
# Add a new portal name here when a new module directory is created.
PORTALS=(
  home
  sdk-guide
  login
  events
  templates
  memory
  domain
  vocab-rules
  settings
  dead-letters
)

# ── Flags ─────────────────────────────────────────────────────────────────────
SKIP_SHARED=false
ONLY_PORTAL=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-shared) SKIP_SHARED=true ; shift ;;
    --portal)      ONLY_PORTAL="$2" ; shift 2 ;;
    *) echo "Unknown flag: $1" ; exit 1 ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────────────────
log()  { echo -e "\033[1;34m▶\033[0m  $*"; }
ok()   { echo -e "\033[1;32m✓\033[0m  $*"; }
warn() { echo -e "\033[1;33m⚠\033[0m  $*"; }
err()  { echo -e "\033[1;31m✗\033[0m  $*" >&2; }

# ── 1. Build shared library ───────────────────────────────────────────────────
if [[ "$SKIP_SHARED" == "false" ]]; then
  log "Building @notify-ui/shared …"
  cd "$SHARED_DIR"
  npm ci --prefer-offline --silent
  npm run build --silent
  ok "Shared library built  →  $SHARED_DIR/dist"
fi

# ── 2. Build portals ──────────────────────────────────────────────────────────
mkdir -p "$STATIC_OUT"

build_portal() {
  local name="$1"
  local portal_dir="$SCRIPT_DIR/$name"

  if [[ ! -d "$portal_dir" ]]; then
    warn "Portal '$name' directory not found — skipping (will be added later)"
    return 0
  fi

  log "Building portal: $name …"
  cd "$portal_dir"
  npm ci --prefer-offline --silent
  # Keep built asset URLs relative so portals work from both file:// previews
  # and their normalized /portals/<name>/ server routes.
  npm run build --silent
  # Replace the previous build in the Spring Boot static folder
  rm -rf "$STATIC_OUT/$name"
  cp -r dist "$STATIC_OUT/$name"
  ok "Portal '$name'  →  $STATIC_OUT/$name"
}

if [[ -n "$ONLY_PORTAL" ]]; then
  # Single-portal mode
  build_portal "$ONLY_PORTAL"
else
  # Parallel mode: launch all builds simultaneously, collect exit codes.
  # Use two parallel arrays (portal names + PIDs) — compatible with bash 3.x on macOS.
  portal_names=()
  portal_pids=()
  for portal in "${PORTALS[@]}"; do
    build_portal "$portal" &
    portal_names+=("$portal")
    portal_pids+=($!)
  done

  failed=()
  for i in "${!portal_pids[@]}"; do
    if ! wait "${portal_pids[$i]}"; then
      failed+=("${portal_names[$i]}")
    fi
  done

  if [[ ${#failed[@]} -gt 0 ]]; then
    err "The following portal builds FAILED: ${failed[*]}"
    exit 1
  fi
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════"
echo "  Build complete."
echo "  Portal assets  →  $STATIC_OUT"
echo "══════════════════════════════════════════════════"
