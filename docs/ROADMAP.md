# Roadmap

Phase 1 (this repository) is a complete, working CRM: architecture,
database schema, auth/RBAC, multi-tenancy, contacts, companies, leads,
deals/pipelines, tasks, the unified activity timeline, real-time
notifications, the dashboard/reporting API, and a full responsive React
UI with all 25 sidebar modules present (the ones below show a "Soon"
badge and a coming-soon page instead of a broken link).

Every Phase 2/3 item below already has a reserved spot in the sidebar
(`frontend/src/utils/nav.ts`), a natural home in the Django app layout
(`backend/apps/`), and in most cases a model already exists to build on
(e.g. `CustomField` supports Tickets/Products already; `Activity`'s
generic FK already accepts any future entity type).

## Phase 2 -- customer communication

- **Email module** -- SMTP send already configured
  (`config/settings/base.py` EMAIL_*); needs: `apps/emails` (EmailThread,
  EmailMessage models), IMAP polling via Celery beat, open/click tracking
  pixels & redirect links, a Gmail-style inbox UI, auto-association with
  Contact/Company/Deal by matching sender/recipient email.
- **WhatsApp module** -- design the provider adapter as a `BaseWhatsAppProvider`
  interface (`send_message`, `receive_webhook`) with a `NullProvider` for
  dev, then concrete adapters for WhatsApp Cloud API and a BSP of choice;
  `apps/whatsapp` (Conversation, Message models); Settings > Integrations
  already has a placeholder card for this.
- **Calls & Meetings** -- click-to-call/log-a-call UI reusing the existing
  `Task` model (`task_type=call|meeting`) as the backing store, or a
  dedicated `apps/calls` if call recording/duration tracking is needed.
- **Tickets** -- `apps/tickets` (Ticket, pipeline reusing the existing
  `Pipeline`/`PipelineStage` pattern, conversation thread reusing
  `Activity`).

## Phase 2 -- growth & marketing

- **Website Tracking + Forms** -- a lightweight JS snippet posting to a
  new `apps/tracking` (WebsiteVisitor, WebsiteSession, PageView) and
  `apps/forms` (Form, FormField, FormSubmission) app; submission handler
  reuses the existing Contact/Lead creation + `notify()` +
  `LeadScoreEvent` (the `website_visit`/`form_submission` scoring rules
  already exist in `settings.LEAD_SCORING_RULES`, just unused until this
  ships).
- **Campaigns** -- `apps/campaigns` capturing UTM source/medium/campaign
  already collected on `Contact` (utm_source/utm_medium/utm_campaign
  fields exist today) and `Lead` (utm_campaign, landing_page already
  exist) -- the campaign performance report mostly aggregates data that's
  already being captured.
- **Automation engine** -- a trigger/condition/action model
  (`apps/automation`: AutomationRule, AutomationAction) evaluated via
  Django signals (the codebase already has the pattern in
  `apps/activities/signals.py`) or Celery tasks for time-based triggers.

## Phase 3 -- operations

- **Reports (export)** -- the dashboard API already returns the chart
  series; Phase 3 adds CSV/Excel/PDF export endpoints (`openpyxl`,
  `reportlab` are already in `requirements.txt`) and the dedicated
  Reports UI beyond the dashboard.
- **Documents** -- `apps/documents` (Document model with FK to any
  entity, permission-aware download URLs); S3-compatible storage support
  is already wired (`USE_S3` in settings) so this is mostly a model +
  upload UI.
- **Products & Quotes** -- `apps/products` (Product, SKU, price, tax,
  stock) and `apps/quotes` (Quote, QuoteItem) with PDF generation via
  `reportlab` (already a dependency).
- **Import/Export** -- CSV/Excel import with field mapping and validation
  preview for Contacts/Companies/Leads/Deals.
- **Two-factor auth, IP allow-listing** -- see `docs/SECURITY.md#known-gaps`.
- **Celery Beat schedules** -- the `celery-beat` service is already
  running in `docker-compose.yml`; Phase 2/3 should add real periodic
  tasks (task-due reminders, IMAP polling, scheduled email sends) to
  `CELERY_BEAT_SCHEDULE`.

## How to pick this up

Each Phase 1 app follows the same shape (`models.py`, `serializers.py`,
`views.py` using `apps.core.viewsets.TenantScopedViewSet`, `urls.py`,
`admin.py`), so a new module is largely copy-the-pattern work. See
`docs/ARCHITECTURE.md` for the conventions (multi-tenancy, RBAC via the
`module` attribute, the generic activity timeline, notifications).
