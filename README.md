# Sehatora CRM

A fully self-hosted, production-oriented CRM platform in the spirit of HubSpot's
workflow, built from scratch with an original UI, brand and codebase. Runs
entirely on infrastructure you control -- no HubSpot subscription, no
mandatory third-party API keys.

This repository ships **Phase 1**: the full architecture, database schema,
authentication/RBAC, and the core sales CRM (contacts, companies, leads,
deals/pipelines, tasks, activities, dashboard). The sidebar already has all
25 planned modules; the ones not yet implemented (Email, WhatsApp, Website
Tracking, Forms, Automation, Reports export, Tickets, Products/Quotes,
Documents, Campaigns) are visibly marked "Soon" in the UI and tracked in
[`docs/ROADMAP.md`](docs/ROADMAP.md) rather than being silently missing.

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Python, Django, Django REST Framework |
| Database | PostgreSQL |
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Auth | JWT (access + rotating refresh tokens), role-based permissions |
| Background jobs | Celery + Redis |
| Real-time | Django Channels (WebSocket notifications) |
| Charts | Recharts |
| Deployment | Docker Compose + Nginx + Gunicorn/Uvicorn |
| API docs | drf-spectacular (OpenAPI 3 / Swagger UI) |

## Repository layout

```
backend/            Django project (config/) + apps (apps/*)
frontend/            React + TypeScript SPA (src/*)
docker/              Dockerfiles + nginx.conf used by docker-compose.yml
docs/                Installation guide, API notes, security checklist, roadmap
docker-compose.yml   Full stack: db, redis, backend, celery, nginx+frontend
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the database schema,
multi-tenancy model and app-by-app breakdown.

## Quickstart (Docker)

```bash
cp .env.example .env        # edit SECRET_KEY, DB_PASSWORD, ALLOWED_HOSTS, etc.
docker compose up -d --build
```

Then open `http://localhost` (or the host/port you set as `HTTP_PORT`). With
`SEED_DEMO_DATA=true` (the default in `.env.example`) the first boot creates
a demo organization, 20 users, 100 contacts, 30 companies, 50 leads, 25
deals across two pipelines, tasks and activity history.

**Demo login:** `admin` / `SehatoraDemo#2026`

Full instructions (local dev without Docker, and production VPS deployment)
are in [`docs/INSTALLATION.md`](docs/INSTALLATION.md).

## API

- Swagger UI: `/api/docs/`
- ReDoc: `/api/redoc/`
- Raw OpenAPI schema: `/api/schema/`

## Security

See [`docs/SECURITY.md`](docs/SECURITY.md) for the checklist covering
authentication, RBAC, tenant isolation, audit logging and what to change
before going to production.

## License / branding

Original code, UI and branding. HubSpot was used only as a reference for
general CRM workflow conventions (pipeline stages, lifecycle stages, lead
scoring) -- no HubSpot source, assets or branding were copied.
