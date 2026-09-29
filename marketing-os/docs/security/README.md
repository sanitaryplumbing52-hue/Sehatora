# Security

## Implemented in Phase 1

| Area | Control | Verified by |
|---|---|---|
| Passwords | bcrypt; ≥12 chars with letter+number; HIBP breach check in production; enumeration-safe login & reset | `LoginTest`, `RegistrationAndVerificationTest` |
| Brute force | 5 failures / email+IP → 429 `login_locked`; per-user 2FA attempt limit; per-IP limits on register/reset | `LoginTest`, `TwoFactorTest` |
| 2FA | TOTP; secret encrypted at rest; recovery codes hashed & single-use; code replay blocked | `TwoFactorTest`, `two-factor.spec.ts` |
| Sessions | DB sessions, `HttpOnly`, `SameSite=Lax`, `Secure` in prod; per-device list & revoke; all sessions revoked on password reset, others on change | `AccountTest` |
| CSRF | `ValidateCsrfToken` on the API group; header set by the API client | e2e |
| Authorization | 11 permission keys → Gates; hierarchical role rules (no escalation, last-owner protected) | `MembersAndInvitationsTest`, `RoleCatalogTest` |
| **Tenant isolation** | membership middleware (404 for outsiders) · Gate · Eloquent global scope (fail-closed) · Postgres **forced RLS** · cross-tenant sweep over every `/orgs/{org}` route (all verbs) | `TenantIsolationTest`, `ArchitectureTest` |
| Audit | append-only (RLS + trigger); actor, subject, request id, IP policy; secrets redacted by key name | `PlatformTest`, `TenantIsolationTest` |
| Secrets | tokens never returned by the API (hidden + tests); `.env` not committed; invitation & session identifiers exposed only as hashes | `AccountTest`, `ArchitectureTest` |
| Input | FormRequests; website URLs normalised to an origin, IPs/localhost/internal TLDs rejected (SSRF groundwork for the Phase 2 crawler) | `WebsiteUrlTest` |
| Errors | RFC 9457 problems, no stack traces or exception text to clients, request-id correlation | `PlatformTest` |
| Transport/headers | HSTS, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`; **per-request nonce CSP** with `strict-dynamic` (Next `proxy.ts`) | manual/e2e |
| XSS | React escaping; ESLint `react/no-danger` is an error; API-provided SVG (2FA QR) rendered via `<img>` data URL | lint |
| Open redirects | `?next=` restricted to same-site paths | `lib.test.ts` |
| Supply chain | lockfiles; CI runs `composer audit`, `npm audit`, gitleaks | CI |
| Health | public endpoint returns status only; details need `HEALTH_CHECK_TOKEN` | `PlatformTest` |

## Known gaps / next steps (be honest about them)

* CSP `style-src` still allows `'unsafe-inline'` (Radix positions popovers with inline styles). Script execution is nonce-locked.
* No email-address change flow yet; social login (Google/Microsoft) is schema-only.
* No account/organization data export or hard-delete job (Phase 10). Organization delete is a soft delete.
* `Secure` cookies and `TRUSTED_PROXIES` are deployment settings — see [deployment](../deployment/README.md).
* Static analysis (PHPStan/Larastan) is not installed yet.
* Encryption uses Laravel's `APP_KEY` (AES-256-CBC + HMAC). Envelope encryption with a KMS-wrapped data key and `key_id`
  rotation is scheduled with `integration_tokens` (Phase 2) — **do not lose or leak `APP_KEY`**; rotate with `APP_PREVIOUS_KEYS`.
* Crawler SSRF controls (DNS pinning, private-range blocking on every redirect hop) are Phase 2 requirements; only URL-shape validation exists.

## Reporting

Email the maintainers privately; do not open public issues for vulnerabilities.
