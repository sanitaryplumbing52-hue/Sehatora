# Installation Guide

## Option A -- Docker Compose (recommended)

Works the same on a local machine, a DigitalOcean/Hetzner/AWS/Hostinger
VPS, or any Ubuntu server with Docker installed.

1. Install Docker + Docker Compose v2 (`docker compose version`).
2. Clone the repo and configure environment variables:
   ```bash
   git clone <this-repo>
   cd Sehatora
   cp .env.example .env
   ```
   Edit `.env`:
   - `SECRET_KEY` -- generate one, e.g. `python -c "import secrets; print(secrets.token_urlsafe(50))"`
   - `DB_PASSWORD` -- a strong password
   - `ALLOWED_HOSTS` -- your domain(s), comma-separated
   - `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` -- the URL(s) you'll access the app from (include the scheme, e.g. `https://crm.example.com`)
   - `HTTP_PORT` -- host port to publish (80 for a bare VPS, or leave for a reverse proxy in front)
   - `SEED_DEMO_DATA` -- `true` for a demo install, `false` for a clean production instance
3. Build and start everything:
   ```bash
   docker compose up -d --build
   ```
   This starts Postgres, Redis, the Django backend (Gunicorn + Uvicorn
   worker, serving both the REST API and WebSockets), a Celery worker, a
   Celery beat scheduler, and an Nginx container serving the built React
   app and reverse-proxying `/api`, `/admin`, `/static`, `/media` and
   `/ws` to the backend.
4. Create your own admin user (skip if you seeded demo data, which
   already creates `admin` / `SehatoraDemo#2026` -- **change that
   password immediately in production**):
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```
   A superuser bypasses RBAC entirely; for day-to-day org admins, create a
   normal user and assign the "Super Admin" or "Admin" role from
   Settings > Team instead.
5. Visit `http://<server-ip-or-domain>:${HTTP_PORT}`.

### Putting a real domain + HTTPS in front

The bundled Nginx container terminates plain HTTP on `HTTP_PORT`. For a
public domain, run a second reverse proxy in front (Caddy, or Nginx +
certbot, or your cloud provider's load balancer) that terminates TLS and
forwards to `HTTP_PORT` -- that keeps certificate renewal out of this
repo's Nginx config. Example with Caddy (`Caddyfile`):

```
crm.example.com {
    reverse_proxy localhost:8080
}
```

(set `HTTP_PORT=8080` in `.env` so Caddy can bind 443/80).

### Updating

```bash
git pull
docker compose up -d --build
docker compose exec backend python manage.py migrate
```

### Backups

Postgres data lives in the `postgres_data` named volume; uploaded files
in `media_data`. A simple daily backup:

```bash
docker compose exec -T db pg_dump -U sehatora sehatora_crm | gzip > backup-$(date +%F).sql.gz
```

Restore with `gunzip -c backup-*.sql.gz | docker compose exec -T db psql -U sehatora sehatora_crm`.

## Option B -- Local development (no Docker)

Requires Python 3.11+, Node 20+, PostgreSQL 14+, Redis.

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env   # adjust DB_* to your local Postgres

createdb sehatora_crm  # or: psql -c "CREATE DATABASE sehatora_crm;"

python manage.py migrate
python manage.py seed_demo_data      # optional demo data
python manage.py createsuperuser     # optional, for /admin/
python manage.py runserver           # http://localhost:8000
```

Run Celery in a second terminal if you're testing background jobs:
```bash
celery -A config worker -l info
```

Run the test suite:
```bash
DB_NAME=sehatora_crm_test pytest
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_PROXY_TARGET defaults to http://localhost:8000
npm run dev             # http://localhost:5173, proxies /api to the backend
```

Login with `admin` / `SehatoraDemo#2026` if you ran `seed_demo_data`.

## Environment variable reference

See `backend/.env.example` for every backend variable (database, JWT
lifetimes, SMTP, S3-compatible storage, CORS/CSRF, timezone) and
`frontend/.env.example` for the frontend's one dev-only variable. The
root `.env.example` is the superset consumed by `docker-compose.yml`.
