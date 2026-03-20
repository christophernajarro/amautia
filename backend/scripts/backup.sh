#!/bin/bash
# Amautia Database Backup Script
# Run with: ./scripts/backup.sh
# Schedule with cron: 0 2 * * * /path/to/backup.sh

set -e

BACKUP_DIR="${BACKUP_DIR:-/tmp/amautia-backups}"
DB_URL="${DATABASE_URL:-postgresql://amautia:amautia_dev@localhost:5432/amautia}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/amautia_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Backing up Amautia database..."
pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"

# Keep only last 7 backups
ls -t "$BACKUP_DIR"/amautia_*.sql.gz | tail -n +8 | xargs -r rm

echo "Backup saved: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
echo "Total backups: $(ls "$BACKUP_DIR"/amautia_*.sql.gz | wc -l)"
