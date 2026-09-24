# Security Checklist

## Already implemented

- **Password hashing** -- Django's PBKDF2 hasher (default), with
  `MinimumLengthValidator(10)` and the other stock Django validators
  enabled in `config/settings/base.py`.
- **CSRF protection** -- Django's CSRF middleware is on; the API is
  JWT-authenticated (bearer token, not cookies) so CSRF mainly matters
  for the Django admin, which is covered.
- **XSS protection** -- React escapes all rendered text by default; no
  `dangerouslySetInnerHTML` is used anywhere in the frontend.
- **SQL injection protection** -- 100% Django ORM, no raw SQL anywhere in
  the codebase.
- **Rate limiting** -- `ScopedRateThrottle` on `/api/auth/login/` and
  `/api/auth/refresh/` (10/min by default, `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES`
  in `config/settings/base.py`).
- **Secure cookies / headers** -- `config/settings/production.py` turns
  on `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`, HSTS (30 days,
  subdomains, preload) and `SECURE_SSL_REDIRECT` whenever
  `DJANGO_SETTINGS_MODULE=config.settings.production` (the Docker image's
  default).
- **Role-based access control** -- every tenant-scoped API endpoint
  declares a `module`; `HasModulePermission` checks the acting user's
  `Role.permissions` map for view/create/edit/delete/export before
  DRF even dispatches to the handler. See `docs/ARCHITECTURE.md#rbac`.
- **Multi-tenant data isolation** -- enforced at the ORM layer for every
  tenant model (`TenantManager`), covered by
  `backend/tests/test_tenant_isolation.py`.
- **Audit logs** -- every non-GET authenticated API call is recorded in
  `AuditLog` (user, org, method, path, IP, user agent, timestamp);
  logins/failed logins are recorded separately in `LoginHistory` with IP
  and user agent. Both are viewable (read-only) in the Django admin.
- **Session/token management** -- JWT access tokens expire in 30 minutes
  by default, refresh tokens in 7 days, refresh tokens rotate on use and
  are blacklisted after rotation (`rest_framework_simplejwt.token_blacklist`).
- **IP logging** -- captured on every login attempt and on the user's
  `last_login_ip`.
- **No secrets in frontend code** -- SMTP credentials, the JWT signing
  key, database credentials and object-storage keys are backend-only
  environment variables; the frontend only ever holds the short-lived JWT
  access/refresh token pair.
- **Automated tests for auth and permissions** -- see
  `backend/tests/test_auth.py`, `test_contacts.py` (role permission
  checks), `test_tenant_isolation.py`.

## Before you go to production -- do these

1. **Change the demo admin password** (or don't seed demo data at all --
   `SEED_DEMO_DATA=false`) and remove/rotate any demo user accounts.
2. **Generate a real `SECRET_KEY`** -- never reuse the `.env.example`
   placeholder.
3. **Set `DEBUG=False`** and use `config.settings.production` (the
   Docker image's default) -- never run `config.settings.development`
   in production.
4. **Set `ALLOWED_HOSTS` / `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS`**
   to your real domain(s) only.
5. **Put TLS in front** (see `docs/INSTALLATION.md`) -- the bundled
   Nginx container serves plain HTTP; terminate HTTPS at a reverse proxy
   or load balancer.
6. **Database backups** -- schedule the `pg_dump` command in
   `docs/INSTALLATION.md`, store off-box.
7. **Restrict `/admin/` and `/api/docs/`** at the network/reverse-proxy
   level if you don't want them public, or at minimum ensure only
   trusted staff have superuser accounts (Django admin bypasses RBAC).
8. **Rotate JWT lifetimes** (`JWT_ACCESS_MINUTES`, `JWT_REFRESH_DAYS`) to
   match your risk tolerance.
9. **Configure real SMTP** (`EMAIL_HOST`/`EMAIL_HOST_USER`/`EMAIL_HOST_PASSWORD`)
   -- the console backend is for development only.
10. **Review `Role.permissions`** for each role in Settings > Roles before
    inviting real users; the shipped presets are a reasonable default,
    not a guarantee of least privilege for your organization.
11. **Enable S3-compatible storage** (`USE_S3=True` + AWS_* variables) if
    you need uploaded files to survive container/volume loss, or ensure
    the `media_data` Docker volume is included in your backup routine.

## Known gaps (tracked, not yet built -- see `docs/ROADMAP.md`)

- Field-level/column-level database encryption is not implemented; only
  password hashing is guaranteed today. If you store especially sensitive
  custom-field data, encrypt it at rest with e.g. `django-cryptography` or
  handle it outside the CRM.
- Two-factor authentication is not implemented.
- IP allow-listing / login geofencing is not implemented.
