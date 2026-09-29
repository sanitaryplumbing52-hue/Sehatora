# Development

## Setup, checks

See the root [README](../../README.md). Test databases: `mios_test` (PHPUnit), `mios_e2e` (Playwright). The DB role must be
a non-superuser (`CREATEDB` is fine) or the RLS tests will (correctly) fail.

## Definition of done for a feature (from the plan)

Migration · Model · Service · API (FormRequest + Resource + route) · Authorization (Gate/permission) · Tests · UI ·
Docs · OpenAPI entry. CI blocks merges if any check fails.

## Adding a tenant-owned resource — checklist

1. Migration: `uuid` PK, `organization_id` FK (+index), then `TenantRls::enable('table')`.
2. Model uses `BelongsToOrganization`.
3. Routes go inside the `orgs/{org}` group with a `can:<permission>` middleware; add the permission to `RoleCatalog`
   (and run `mios:sync-catalogs`).
4. Controller stays thin → Service does the work, calls `Audit::record('thing.created', …, projectId: …)`.
5. Add the operation to `openapi.yaml`, run `npm run api:types`.
6. Tests: happy path, validation, 401/403/404, **cross-tenant** (the sweep in `TenantIsolationTest` covers new routes
   automatically; add a child-id case if the route has nested ids).

## Adding a metric (Phase 2+)

Add its definition to `MetricRegistry`; return a real `MetricEnvelope` from a provider-backed resolver; if data is
missing return a non-`ok` status with `reason` and `action` — **never** a default number. The UI needs no change.

## Conventions

* PHP: Pint (Laravel preset), `declare(strict_types=1)` in domain code, no logic in controllers, no `env()` outside config.
* TS: `strict` + `noUncheckedIndexedAccess`, no `any`, API types only from the generated schema, forms = react-hook-form + zod
  with server errors mapped to fields via `useAction`.
* UI copy: say what failed, why, and what to do next (`ProblemAlert`); never "Something went wrong".
* Gotcha: Laravel passes route parameters to controller methods **positionally**; `ResolveOrganization` removes `{org}`
  from the route so `string $user` style parameters bind correctly.
* Tests must not depend on real time or network; e2e reads mail from the Laravel log (no test-only backdoors).

## Git workflow

`main` (deployable) ← `develop` ← `feature/*`, `bugfix/*`. Squash-merge small PRs; CI must be green.
