# Integrations

**Phase 1 ships no provider adapters.** `GET /orgs/{org}/integrations` returns the catalog of planned providers, each
`not_connected` / `available: false` with the phase it arrives in. This is deliberate: a Connect button that did
nothing, or a metric backed by sample data, would violate the product's central rule.

## Adapter contract (Phase 2+)

```
ProviderAdapter: authorizationUrl · exchangeCode · refresh (throws ReauthRequired) · discoverAccounts · capabilities · fetch (paged)
Normalizer:      RawPage → provider-neutral fact DTOs
Pipeline:        Adapter → raw_payloads → Normalizer → fact_* tables (sync_run_id lineage) → MetricEnvelope
```

Only code under `app/Domain/Integrations/` may make external HTTP calls (architecture test).

## Every integration must document (template)

`docs/integrations/<provider>.md` with these headings:

1. **Authentication** — OAuth flow, redirect URIs, state/PKCE handling
2. **Permissions** — exact scopes (least privilege; read-only until an Approval-workflow executor exists)
3. **API limitations** — quotas, history window, data delay, sampling/thresholding, anonymised rows
4. **Sync frequency** — schedule, trailing re-sync window for restated data
5. **Available metrics** — and which are *unavailable* per account type
6. **Error handling** — mapping to `AuthExpired | PermissionDenied | QuotaExceeded | Transient | InvalidRequest | ProviderDown` and the user-facing message + action
7. **Token lifecycle** — storage (encrypted), refresh, rotation, revocation on disconnect

## External approvals to start now (lead time: weeks)

Google OAuth verification (Search Console / GA4 / Ads scopes) · Google Ads developer token · Meta App Review / Business
Verification · a keyword-volume provider (Search Console and GA4 do not supply volume; until then "Unavailable").
