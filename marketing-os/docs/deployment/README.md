# Deployment

## Processes

| Process | Command | Notes |
|---|---|---|
| Web | `npm run build && npm start` (Node 22) | set `API_INTERNAL_URL` **at build time** (rewrite destination) and runtime |
| API | php-fpm/Octane behind nginx, `public/` as docroot | PHP ≥ 8.3 with `pdo_pgsql redis intl sodium mbstring` |
| Worker | `php artisan queue:work redis --queue=mail,default --tries=3` | supervised; restart on deploy (`queue:restart`) |
| Scheduler | `php artisan schedule:work` (one instance) | nothing scheduled in Phase 1 |
| Postgres 16 / Redis 7 | managed | app DB role must be **non-superuser, no BYPASSRLS** |

## Environment (API)

Copy `.env.example`. Never commit `.env`. Required in production:

`APP_ENV=production APP_DEBUG=false APP_KEY=… APP_URL=https://api… FRONTEND_URL=https://app…`
`DB_*` · `REDIS_*` (`CACHE_STORE=redis QUEUE_CONNECTION=redis`) · `SESSION_DRIVER=database SESSION_SECURE_COOKIE=true SESSION_DOMAIN=…`
`MAIL_*` (real SMTP/API) · `APP_DATA_MODE=live` (**`demo` refuses to boot in production**) ·
`TRUSTED_PROXIES` (IP/CIDR list of your load balancer / Next server so `X-Forwarded-For` is honoured — required for correct
login throttling and audit IPs) · `HEALTH_CHECK_TOKEN` · `PRIVACY_IP_MODE=truncated|hashed|full`.

Web: `API_INTERNAL_URL`. That is the only variable; no secret ever reaches the browser bundle.

## Release procedure

1. CI green (API lint+tests, web lint/types/unit/build, contract check, e2e, security scan).
2. Build artifacts; run `php artisan migrate --force` **before** shifting traffic — migrations must be backwards-compatible
   (expand → deploy → contract).
3. `php artisan config:cache route:cache` then `queue:restart`.
4. Verify `GET /api/v1/system/health` and `…/details` with the ops token.

`php artisan mios:sync-catalogs` re-syncs roles, permissions and plan entitlements after editing `RoleCatalog` or `config/plans.php`.

## Environments

local · development · staging · production — separate databases, OAuth apps and keys per environment; nothing
environment-specific is hard-coded.
