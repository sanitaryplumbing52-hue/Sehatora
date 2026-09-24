#!/bin/sh
set -e

echo "Waiting for database at ${DB_HOST:-db}:${DB_PORT:-5432}..."
until python - <<'PYEOF'
import os
import socket
import sys

host = os.environ.get("DB_HOST", "db")
port = int(os.environ.get("DB_PORT", "5432"))
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(2)
try:
    sock.connect((host, port))
except OSError:
    sys.exit(1)
finally:
    sock.close()
PYEOF
do
  sleep 1
done
echo "Database is up."

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  python manage.py migrate --noinput
  python manage.py collectstatic --noinput

  if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
    echo "Seeding demo data..."
    python manage.py seed_demo_data || true
  fi
fi

exec "$@"
