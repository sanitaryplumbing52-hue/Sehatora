# STYLEAI — AI Personal Stylist & Virtual Try-On Platform

Upload a photo, get a personal style profile, and generate AI-powered
outfits, color recommendations, and virtual try-on previews.

Full architecture (ERD, API spec, AI pipeline, folder structure, page map):
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui-style
components · Prisma · PostgreSQL · Auth.js (NextAuth) · S3-compatible storage
· a provider-agnostic AI abstraction layer.

## Quickstart (Demo Mode)

Demo Mode runs the full app — including AI analysis, virtual try-on, and the
style chat — **without any external AI API keys**, using deterministic mock
providers and local-disk photo storage.

```bash
npm install
cp .env.example .env
# set DATABASE_URL to a local/dev Postgres instance, and NEXTAUTH_SECRET
# (openssl rand -base64 32)

npm run db:push      # create the schema
npm run db:seed      # seed colors, categories, brands, demo clothing/outfits, demo users
npm run dev
```

Visit `http://localhost:3000`. Demo accounts (created by the seed script):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@styleai.app` | `StyleAIAdmin123!` |
| User | `demo@styleai.app` | `StyleAIDemo123!` |

## Switching to Production AI Mode

Set in `.env`:

```bash
AI_PROVIDER=production
OPENAI_API_KEY=sk-...                       # vision analysis, text, image generation
REPLICATE_API_TOKEN=r8_...                  # virtual try-on
REPLICATE_TRYON_MODEL_VERSION=<model-version-id>
```

See `ai/providers/production-provider.ts` for exactly what each integration
calls and expects. The app falls back to Demo Mode automatically if
`OPENAI_API_KEY` is missing, so it's safe to deploy without every credential
set.

## Production storage (S3-compatible)

Set `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
(and `S3_ENDPOINT` for R2/B2/MinIO). Without these, photos are stored on
local disk under `.data/uploads/` and served through signed, ownership-
checked routes — fine for demoing, not for a multi-instance deployment.

## Scripts

```bash
npm run dev          # start dev server
npm run build         # production build
npm run start         # start production server
npm run typecheck     # tsc --noEmit
npm run lint           # next lint
npm run db:push        # push Prisma schema (dev)
npm run db:migrate     # create a migration
npm run db:seed        # run prisma/seed.ts
npm run db:studio      # Prisma Studio
```

## Deployment

1. Provision PostgreSQL (Neon, Supabase, RDS, etc.) and set `DATABASE_URL`.
2. Provision S3-compatible storage and set the `S3_*` vars (optional — omit
   for local-disk demo storage).
3. Set `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`.
4. Optionally set Google/Apple OAuth credentials, `AI_PROVIDER=production`
   plus its credentials, and Stripe keys for subscriptions.
5. Run `npm run db:migrate` (or `db:push` for a first deploy) and
   `npm run db:seed` against the target database.
6. `npm run build && npm run start`, or deploy to Vercel/any Node host.
   On a serverless platform, replace the fire-and-forget job execution in
   `app/api/analysis/route.ts` / `app/api/try-on/route.ts` with a real queue
   (see §4 of the architecture doc) so long-running AI jobs aren't killed
   mid-request.

## Project layout

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#8-folder-structure).

## Security & privacy notes

- Uploaded photos are never public — every read goes through a signed,
  ownership-checked URL (S3 presigned URL in production, a signed internal
  route in Demo Mode).
- AI processing requires explicit user consent at upload time.
- Users can delete any photo, at any time, from their dashboard.
- Shopping Mode never hardcodes fake product availability — it starts
  empty and is populated via the Admin Panel or a real affiliate/store feed
  integration.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md#10-security--privacy) for
the full list.
