# Architecture (as built — Phase 1)

The full target architecture and 10-phase roadmap live in
[`docs/marketing-os/ARCHITECTURE.md`](../../../docs/marketing-os/ARCHITECTURE.md). This page records what
Phase 1 actually implements and where it deliberately differs.

## Runtime shape

```
Browser ──► Next.js (RSC + client components) ──/api,/sanctum rewrite──► Laravel API ──► PostgreSQL (RLS)
                 └─ server components call the API directly with the visitor's cookie   └──► Redis (cache, queue, rate limits)
```

* The browser only talks to the Next.js origin. `/api/*` and `/sanctum/*` are proxied to Laravel, so session
  cookies are first-party and no CORS is required. `API_INTERNAL_URL` is server-side only and is read at
  **build time** for the rewrite destination.
* Auth is a cookie session (database driver) with CSRF (`XSRF-TOKEN` → `X-XSRF-TOKEN`). No tokens in JS.

## Layers (backend)

`Route → Middleware (auth, verified.email, org) → FormRequest → Gate (permission) → Controller → Service → Domain → Eloquent → Postgres`

```
app/Domain/{Identity,Tenancy,Projects,Analytics,Audit,Billing,Integrations,System}
app/Http/{Controllers/Api/V1,Middleware,Requests,Resources}
```

Enforced by `tests/Feature/Platform/ArchitectureTest`: controllers never use `DB::`/HTTP clients, only
`Domain/Integrations` may call external HTTP, only the `Audit` service writes `audit_logs`, no `env()` outside config,
every `organization_id` table has forced RLS (or is allow-listed with a reason).

## Multi-tenancy

`ResolveOrganization` resolves `{org}` (uuid or slug), verifies membership (non-members get **404**, never 403),
activates `TenantContext` (which sets `app.current_org` on the Postgres session) and clears it in `finally`.
Tenant models use `BelongsToOrganization` (global scope, fail-closed with no context). Details: [security](../security/README.md).

## Analytics contract

`DataStatus` (`ok | not_connected | unavailable | insufficient_data | stale | error | no_data`) and `MetricEnvelope`
are the only way a metric reaches the UI; `MetricCard` is the only component that renders one.
`MetricRegistry` holds definitions (label, unit, calculation, sources). In Phase 1 `OverviewService` returns
`not_connected` for every metric because no provider can be connected yet.

## Deviations from the approved plan (and why)

| Plan | As built | Reason |
|---|---|---|
| Laravel Horizon | plain `queue:work` on Redis; queues `mail`, `default` | nothing heavy is queued yet; add Horizon in Phase 2 with the crawler |
| `metric_definitions` table | `MetricRegistry` in code | definitions are versioned with code; a table adds nothing until users can define metrics |
| Sanctum SPA guard | Sanctum installed (PATs for the future public API) but the SPA uses the plain `web` session guard + CSRF | simpler, no behavioural difference for cookie auth |
| Larastan / PHPStan level 8 | not installed | package download from GitHub was blocked in the build environment; add to CI when available |
| RLS on all tenant tables | RLS on `projects, websites, domains, audit_logs`; **not** on `organization_users, invitations, subscriptions` | they are read before a tenant context can exist (membership lookup, invitation token, entitlement at org creation). Allow-listed with reasons in the architecture test |
| `usage_records`, `notifications`, `integrations*` tables | not created | no writer exists yet; created with their first feature (Phases 2–3) |
| Google / Microsoft login | `oauth_identities` table only | architecture prepared; no routes, feature off |
| Spatie permissions | small custom `RoleCatalog` (6 fixed roles, permission keys as Gate abilities) | less magic, one source of truth, synced idempotently |
