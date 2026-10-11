#!/usr/bin/env bash
# Process Craft's queue once. No arguments; exit status reports success/failure.
# Example cron: * * * * * /home/pdaleramirez/vuesmiledental/ops/run-queue.sh
# Resolves this checkout from the script location and prevents overlapping workers.
set -euo pipefail
site_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$site_root"
mkdir -p storage/runtime
exec 9>storage/runtime/queue-cli.lock
flock -n 9 || exit 0
exec /usr/bin/php craft queue/run --interactive=0
