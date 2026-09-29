# Marketing Intelligence OS

> Real data. Real integrations. Real calculations. Real analytics. Real workflows. Real permissions. Real auditability.

A multi-tenant marketing operating system. **Phase 1 (this milestone) is the foundation**: authentication,
organizations & roles, projects & websites, tenant isolation, audit log, API contract, design system.
Nothing in the product shows a number that did not come from a connected source — with no integrations
connected yet, every metric honestly reads **Not connected**.

| | |
|---|---|
| `apps/api` | Laravel 13 · PHP 8.4 · PostgreSQL 16 (row-level security) · Redis · REST `/api/v1` |
| `apps/web` | Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind 4 · TanStack Query · Zod |
| `packages/api-contract` | `openapi.yaml` — source of truth; TypeScript types are generated from it |
| `docs/` | architecture · database · api · integrations · deployment · security · development |
| `../docs/marketing-os/ARCHITECTURE.md` | the full approved architecture & 10-phase plan |

## Quickstart

Prerequisites: PHP 8.3+ (`pdo_pgsql`, `redis`, `intl`, `sodium`), Composer, Node 22, PostgreSQL 16, Redis.

```bash
# 1. infrastructure (or use your own Postgres/Redis)
docker compose -f infra/docker/docker-compose.yml up -d

# 2. API
cd apps/api
composer install
cp .env.example .env && php artisan key:generate     # set DB_* in .env
php artisan migrate                                   # also seeds roles, permissions, plans
php artisan serve                                     # http://localhost:8000
php artisan queue:work --queue=mail,default           # invitation emails

# 3. Web (second terminal)
cd apps/web
npm install
npm run dev                                           # http://localhost:3000
```

Open http://localhost:3000, register, and read the verification link from `storage/logs/laravel.log`
(`MAIL_MAILER=log`) or point `MAIL_*` at Mailpit (http://localhost:8025).

## Checks

```bash
# API
cd apps/api && composer lint && php artisan test          # Pint + PHPUnit (unit, feature, architecture, OpenAPI parity) (needs Postgres db `mios_test`)
# Web
cd apps/web && npm run lint && npm run typecheck && npm test && npm run build
# End-to-end (real API + database `mios_e2e` + real Next.js)
cd apps/web && npm run e2e
# Regenerate the typed API client after editing openapi.yaml
cd apps/web && npm run api:types
```

## Principles that are enforced, not just stated

- **No fake data.** A metric only leaves the analytics layer as a `MetricEnvelope`; `value` must be `null`
  unless `status` is `ok`/`stale`. `APP_DATA_MODE=demo` cannot boot in production.
- **Tenant isolation in five layers:** membership middleware → policies/permissions → Eloquent global scope →
  Postgres RLS (`FORCE`) → cross-tenant test sweep over every org-scoped route.
- **Layering:** Controller → FormRequest → Service → Domain → Model. Architecture tests fail the build otherwise.
- **Auditability:** append-only `audit_logs` (RLS + trigger), secrets redacted.
- **Contract-first:** every route must appear in `openapi.yaml` (parity test) and the TS client is generated.

See [`docs/`](docs/) for details and [`docs/development/README.md`](docs/development/README.md) to add a module.
