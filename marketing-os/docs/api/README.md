# API

Base path `/api/v1`. The contract is [`packages/api-contract/openapi.yaml`](../../packages/api-contract/openapi.yaml)
(OpenAPI 3.1, 46 operations). `OpenApiParityTest` fails if a route and the spec disagree; the web app's types
(`apps/web/src/lib/api/schema.d.ts`) are generated from it (`npm run api:types`, checked in CI).

## Authentication & CSRF

Cookie session. Browser flow: `GET /sanctum/csrf-cookie` (once) → send `X-XSRF-TOKEN` (the decoded `XSRF-TOKEN`
cookie) on every non-GET request. The web app's `api` client does this automatically. Future public/mobile API
will use scoped personal access tokens (Sanctum tokens are already installed on `User`).

Sign-in with 2FA: `POST /auth/login` → `{ "two_factor_required": true }` → `POST /auth/2fa/challenge`
`{ code | recovery_code }`.

## Tenant scoping

Everything under `/orgs/{org}/…` takes the organization **uuid or slug**. The caller must be a member — otherwise
**404** (never 403) so existence is not leaked. Permission failures inside an org are 403. Users with an unverified
email get 403 `email_unverified` on organization routes.

## Errors — RFC 9457 problem details (`application/problem+json`)

```json
{ "type": "https://docs.marketing-os.local/problems/website-already-exists", "title": "This website is already added to your organization.",
  "status": 422, "code": "website_already_exists", "detail": "Each domain can be added once per organization.", "request_id": "…" }
```

Validation errors add `errors: { field: [messages] }`. Stable `code`s used by the UI include: `unauthenticated`,
`forbidden`, `not_found`, `validation_failed`, `invalid_credentials`, `login_locked` (+`retry_after`), `rate_limited`,
`email_unverified`, `entitlement_exceeded` (+`feature`), `role_escalation`, `role_hierarchy`, `last_owner`,
`already_member`, `invalid_invitation`, `invitation_email_mismatch`, `invalid_website_url`, `website_already_exists`,
`csrf_mismatch`, `server_error`. 5xx bodies never contain stack traces or exception text; quote `request_id`
(also the `X-Request-Id` header, which clients may supply) to find the log line.

## Conventions

* JSON resources are wrapped in `data`. Lists: `data[]`; page pagination (`links`, `meta`) for projects, **cursor**
  pagination for the audit log (`meta.next_cursor`).
* Booleans in query strings accept `true|false|1|0`.
* Rate limits: 240/min per user (IP if anonymous); auth endpoints 10/min per IP; login lockout after 5 failures per
  email+IP for 5 minutes; verification resend 6/min.
* Long-running work will return `202` with a job resource (from Phase 2; nothing in Phase 1 is asynchronous for the caller).

## Metrics

`GET /orgs/{org}/projects/{project}/dashboard/overview` returns `MetricEnvelope[]`:
`status ∈ ok | not_connected | unavailable | insufficient_data | stale | error | no_data`. `value` is `null` unless
`ok`/`stale`; every envelope carries its `calculation`, expected/actual `source`, `period`, `comparison`,
`last_synced_at`, `attribution_note`, `lineage_id`, and — when there is no value — a `reason` and an `action`.

## Health

`GET /system/health` (public, `{status}` only, 503 when a core dependency is down) and
`GET /system/health/details` (bearer `HEALTH_CHECK_TOKEN`; disabled — 404 — when unset): database, cache, queue, storage.
Third-party provider outages never fail health; they surface per-integration (Data Health, Phase 2+).
