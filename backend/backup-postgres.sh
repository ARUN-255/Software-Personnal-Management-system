#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
set -a
source .env
set +a
mkdir -p backups
backup_file="backups/personnel_$(date +%Y%m%d_%H%M%S).sql.gz"
database_url="${DB_URL#jdbc:}"
PGPASSWORD="$DB_PASSWORD" pg_dump --dbname="$database_url" --username="$DB_USERNAME" --no-owner --no-privileges | gzip > "$backup_file"
find backups -type f -name 'personnel_*.sql.gz' -mtime +14 -delete
echo "Backup saved to $backup_file"
