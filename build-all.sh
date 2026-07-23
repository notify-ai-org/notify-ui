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
#   ./notify-ui/build-all.sh --skip-shared       # skip rebuilding shared library
#   ./notify-ui/build-all.sh login clients       # build selected portals
#   ./notify-ui/build-all.sh --portal events     # legacy alias for one portal
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
  login
  events
  schedules
  logs
  clients
  templates
  domain
  vocab-rules
  memory
  agents
  settings
  dead-letters
)

# ── Flags ─────────────────────────────────────────────────────────────────────
SKIP_SHARED=false
SELECTED_PORTALS=()
SELECTED_PORTAL_COUNT=0

while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-shared) SKIP_SHARED=true ; shift ;;
    --portal)
      [[ $# -ge 2 ]] || { echo "--portal requires a portal name" >&2; exit 1; }
      SELECTED_PORTALS+=("$2")
      SELECTED_PORTAL_COUNT=$((SELECTED_PORTAL_COUNT + 1))
      shift 2
      ;;
    --*)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
    *)
      SELECTED_PORTALS+=("$1")
      SELECTED_PORTAL_COUNT=$((SELECTED_PORTAL_COUNT + 1))
      shift
      ;;
  esac
done

# ── Helpers ───────────────────────────────────────────────────────────────────
log()  { echo -e "\033[1;34m▶\033[0m  $*"; }
ok()   { echo -e "\033[1;32m✓\033[0m  $*"; }
warn() { echo -e "\033[1;33m⚠\033[0m  $*"; }
err()  { echo -e "\033[1;31m✗\033[0m  $*" >&2; }

is_known_portal() {
  local candidate="$1"
  local portal
  for portal in "${PORTALS[@]}"; do
    [[ "$portal" == "$candidate" ]] && return 0
  done
  return 1
}

if [[ "$SELECTED_PORTAL_COUNT" -gt 0 ]]; then
  for portal in "${SELECTED_PORTALS[@]}"; do
    if ! is_known_portal "$portal"; then
      err "Unknown portal: $portal"
      err "Available portals: ${PORTALS[*]}"
      exit 1
    fi
  done
fi

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

if [[ "$SELECTED_PORTAL_COUNT" -gt 0 ]]; then
  # Positional portal names select a focused build. No names means build all.
  for portal in "${SELECTED_PORTALS[@]}"; do
    build_portal "$portal"
  done
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
  failed_count=0
  for i in "${!portal_pids[@]}"; do
    if ! wait "${portal_pids[$i]}"; then
      failed+=("${portal_names[$i]}")
      failed_count=$((failed_count + 1))
    fi
  done

  if [[ "$failed_count" -gt 0 ]]; then
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
