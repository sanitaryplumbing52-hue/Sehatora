# Architecture

## Multi-tenancy

Every business ("Organization") shares the same database and application
tier -- there's no per-tenant schema or database, which keeps a
single-VPS deployment simple. Isolation is enforced at the query layer:

- `apps.core.models.Organization` is the tenant.
- `apps.core.models.TenantModel` (abstract) puts an `organization` FK on
  every tenant-owned model, and its `objects` manager
  (`apps.core.models.TenantManager`) automatically filters every queryset
  by the *current* organization.
- The "current organization" is a thread-local set by
  `apps.core.viewsets.TenantScopedViewSet.initial()` as soon as DRF has
  authenticated the request (JWT auth only resolves `request.user` inside
  the view, after Django's own middleware has already run -- see the
  docstring on `apps.core.middleware.CurrentOrganizationMiddleware` for
  why the org can't be set in middleware itself).
- `Model.all_objects` is the unfiltered manager, used only in trusted
  contexts (Celery tasks, the dashboard aggregation view, the seed
  script) that explicitly pass `organization=` on every query.

This is enforced end-to-end by `backend/tests/test_tenant_isolation.py`:
cross-tenant reads 404, cross-tenant writes 404, and global search never
leaks another tenant's rows.

Because tenancy is row-level rather than schema-level, turning this into a
SaaS product later is mostly a matter of tenant onboarding/billing UI --
the data isolation is already there.

## RBAC

`apps.accounts.models.Role` stores a `permissions` JSON map of
`{module: [view, create, edit, delete, export]}`. Seven built-in presets
(Super Admin, Admin, Manager, Sales, Marketing, Support, Viewer) are
seeded per organization; admins can edit the matrix per role from
Settings > Roles & Permissions. `apps.core.permissions.HasModulePermission`
reads a viewset's `module` attribute and the DRF action being performed to
decide view/create/edit/delete/export, so adding RBAC to a new endpoint is
one class attribute.

## Unified activity timeline

`apps.activities.models.Activity` uses a generic foreign key
(`content_type` + `object_id`) so Contacts, Companies, Leads, Deals (and
Tickets once built) all share one timeline table and one `Timeline`
frontend component. `apps.activities.signals` listens for `post_save` on
Contact/Company/Lead/Deal to auto-log "created" and "deal stage changed"
entries; anything else (calls, notes, meetings) is logged explicitly via
`POST /api/activities/`.

## Lead scoring

Scoring rules live in `settings.LEAD_SCORING_RULES` (website visit +5,
form submission +10, email opened +3, email clicked +5, WhatsApp reply
+10, meeting booked +20) -- change the numbers there, no migration
needed. Each firing is recorded as an immutable
`apps.leads.models.LeadScoreEvent` row (not just a mutated integer), so a
lead's score is always reconstructable/auditable; the lead and its
contact's cached `score`/`lead_score` fields are recomputed as a sum on
every event.

## Pipelines & deals

`Pipeline` -> `PipelineStage` -> `Deal` is a plain FK chain; an
organization can create unlimited pipelines and unlimited stages per
pipeline, and a stage's `is_won`/`is_lost` flags drive dashboard
aggregation and the deal-stage-changed activity/notification. Moving a
card in the Kanban board hits `POST /api/deals/{id}/move-stage/`, which
recalculates probability, `closed_at`, and (via the `Deal` signal) logs
the activity and notifies the owner in one request.

## Real-time notifications

`apps.activities.utils.notify()` writes a `Notification` row (durable,
always works) and best-effort pushes it over a per-user Channels group
(`user_<id>_notifications`) so the topbar bell updates live when Redis is
reachable; a Redis hiccup never fails the request that triggered the
notification.

## Database schema

Run `python manage.py graph_models -a -o schema.png` (via
`django-extensions`, already installed) for a live ER diagram, or browse
`backend/apps/*/models.py` -- each app is one bounded context:

| App | Owns |
|---|---|
| `core` | Organization (tenant), Tag, CustomField/CustomFieldValue, AuditLog |
| `accounts` | User, Role, Team, LoginHistory |
| `contacts` | Contact |
| `companies` | Company |
| `leads` | Lead, LeadScoreEvent |
| `deals` | Pipeline, PipelineStage, Deal |
| `activities` | Activity (generic timeline), Notification |
| `tasks` | Task |

## Frontend

Vite + React + TypeScript, Tailwind for styling, TanStack Query for all
server state (no ad-hoc `useEffect` fetching), Zustand for
auth/UI-preference client state (persisted to `localStorage`), `@dnd-kit`
for the deal Kanban board, Recharts for the dashboard. `src/api/client.ts`
is a single Axios instance with a response interceptor that transparently
refreshes the JWT access token on a 401 and retries the original request
once.
