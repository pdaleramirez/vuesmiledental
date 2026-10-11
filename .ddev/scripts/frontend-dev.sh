#!/usr/bin/env bash
set -euo pipefail
cd /var/www/html/frontend

# Docker creates named volumes as root; assign this npm-only volume to the web user.
sudo chown "$(id -u):$(id -g)" node_modules

task_dependency_stamp="$(sha256sum package-lock.json | cut -d ' ' -f 1)-$(node --version)"
task_stamp_file="node_modules/.ddev-dependency-stamp"
if [[ ! -f "$task_stamp_file" ]] || [[ "$(cat "$task_stamp_file")" != "$task_dependency_stamp" ]]; then
  npm ci --no-audit --no-fund
  printf '%s' "$task_dependency_stamp" > "$task_stamp_file"
else
  npm run postinstall
fi
# Supervise Nuxt directly so stopping/restarting does not leave npm's child server
# listening on port 3000 while the next instance silently chooses another port.
exec node node_modules/nuxt/bin/nuxt.mjs dev --host 0.0.0.0 --port 3000
