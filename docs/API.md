# API

Interactive docs (generated from the actual DRF viewsets/serializers via
drf-spectacular, always up to date):

- Swagger UI -- `/api/docs/`
- ReDoc -- `/api/redoc/`
- Raw OpenAPI 3 schema -- `/api/schema/`

## Auth

All endpoints below `/api/` except `/api/auth/login/` and
`/api/auth/refresh/` require `Authorization: Bearer <access_token>`.

```
POST /api/auth/login/            { username, password } -> { access, refresh, user }
POST /api/auth/refresh/          { refresh } -> { access }
POST /api/auth/logout/           { refresh } -> blacklists the refresh token
GET  /api/auth/me/               current user profile + effective permissions
PATCH /api/auth/me/              update own profile
POST /api/auth/change-password/  { old_password, new_password }
```

## Resource endpoints

Every resource below is a standard DRF `ModelViewSet`
(list/retrieve/create/update/partial_update/destroy) mounted under the
path shown, plus the extra actions noted. All support `?search=`,
`?ordering=`, `?page=`/`?page_size=`, and field filters (see each
viewset's `filterset_fields` in `backend/apps/*/views.py`).

| Path | Extra actions |
|---|---|
| `/api/contacts/` | `{id}/timeline/`, `{id}/deals/`, `{id}/tasks/`, `{id}/log_contact/` |
| `/api/companies/` | `{id}/timeline/`, `{id}/touch/` |
| `/api/leads/` | `{id}/convert_to_deal/`, `{id}/score-event/` |
| `/api/leads/score-events/` | read-only |
| `/api/deals/` | `kanban/?pipeline=`, `{id}/move-stage/`, `{id}/timeline/` |
| `/api/deals/pipelines/` | |
| `/api/deals/stages/` | |
| `/api/tasks/` | `mine/`, `kanban/`, `{id}/complete/` |
| `/api/activities/` | list + create (notes/manual timeline entries) |
| `/api/notifications/` | `unread_count/`, `{id}/mark_read/`, `mark-all-read/` |
| `/api/auth/users/` | org-scoped user management |
| `/api/auth/roles/` | RBAC permission matrix per role |
| `/api/auth/teams/` | |
| `/api/tags/` | |
| `/api/custom-fields/` | admin-defined fields per entity |
| `/api/dashboard/summary/` | `?range=today\|yesterday\|last_7_days\|last_30_days\|this_month\|last_month\|custom&start=&end=` |
| `/api/search/` | `?q=` global instant search across contacts/companies/leads/deals/tasks |

## Example

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"SehatoraDemo#2026"}'

curl http://localhost:8000/api/contacts/?search=jane \
  -H "Authorization: Bearer <access_token>"
```
