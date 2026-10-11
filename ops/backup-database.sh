#!/usr/bin/env bash
# Back up this Craft database, retaining 14 days of this script's backups.
# No arguments. Returns a nonzero exit status if backup/gzip fails.
# Example cron: 0 18 * * * /home/pdaleramirez/vuesmiledental/ops/backup-database.sh
# Run as the app owner. Reads credentials from .env without logging them.
# Backups are local to this EC2 disk; off-server disaster recovery is separate.
set -euo pipefail
umask 077
site_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$site_root"
mkdir -p storage/backups
exec 9>storage/backups/backup.lock
flock -n 9 || exit 0
backup_path="storage/backups/vuesmile-$(date -u +%Y%m%dT%H%M%SZ).sql"
/usr/bin/php craft db/backup "$backup_path" --interactive=0
gzip "$backup_path"
find storage/backups -maxdepth 1 -type f -name 'vuesmile-*.sql.gz' -mtime +14 -delete
