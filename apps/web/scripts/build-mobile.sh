#!/usr/bin/env bash
# Sync the Capacitor native projects.
# The app loads from the live Vercel deployment (server.url in capacitor.config.ts).
# For local dev: CAPACITOR_DEV_SERVER_URL=http://<your-ip>:3000 ./scripts/build-mobile.sh
#
# Usage:
#   ./scripts/build-mobile.sh           → sync both platforms
#   ./scripts/build-mobile.sh android   → sync + open Android Studio
#   ./scripts/build-mobile.sh ios       → sync + open Xcode

set -euo pipefail

PLATFORM=${1:-""}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$WEB_DIR"

echo "→ Running cap sync..."
pnpm cap sync

if [ "$PLATFORM" = "android" ]; then
  echo "→ Opening Android Studio..."
  pnpm cap open android
elif [ "$PLATFORM" = "ios" ]; then
  echo "→ Opening Xcode..."
  pnpm cap open ios
fi

echo "✓ Sync complete."
