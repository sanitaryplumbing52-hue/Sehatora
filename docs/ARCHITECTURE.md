# STYLEAI — Architecture

AI Personal Stylist & Virtual Try-On Platform. This document is the system
design reference: data model, user flow, API surface, AI pipeline, folder
structure, and UI page map.

## 1. System overview

```
┌─────────────┐      ┌──────────────────┐      ┌────────────────────┐
│  Next.js UI │─────▶│  Next.js API      │─────▶│  PostgreSQL (Prisma)│
│ (App Router)│      │  Route Handlers   │      └────────────────────┘
└─────────────┘      │  (app/api/**)     │
       │             └──────────┬─────────┘
       │                        │
       ▼                        ▼
┌─────────────┐      ┌──────────────────────┐      ┌──────────────────┐
│ S3-compatible│◀────▶│  AI Abstraction Layer │─────▶│ External AI APIs │
│   Storage    │      │  (ai/ AIProvider)     │      │ (OpenAI, Replicate)│
└─────────────┘      └──────────────────────┘      └──────────────────┘
```

- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui-style
  components, Framer Motion for select interactions.
- **Backend**: Next.js Route Handlers (`app/api/**`), business logic isolated
  in `services/` and `lib/`, never inline in route files.
- **Database**: PostgreSQL via Prisma ORM (`prisma/schema.prisma`).
- **Storage**: S3-compatible object storage in production; local-disk DEMO
  MODE storage behind signed URLs when no cloud credentials are configured
  (`lib/storage.ts`).
- **AI**: A single `AIProvider` interface (`ai/types.ts`) with a `demo`
  implementation (deterministic, no external calls) and a `production`
  implementation (real OpenAI + Replicate calls). Selected at runtime by
  `getAIProvider()` — see `ai/index.ts`.

## 2. Database ERD (selected relationships)

```
User 1─1 Profile
User 1─1 StyleProfile ──(sourcePhoto)──▶ Photo
User 1─1 StylePreference
User 1─1 Subscription
User 1─N Photo
User 1─N TryOnSession ──▶ Photo, Outfit
User 1─N AIGeneration
User 1─N Recommendation
User 1─N SavedOutfit ──▶ Outfit
User 1─N Favorite
User 1─N UsageCounter
User 1─N ColorRecommendation ──▶ Color

Outfit 1─N OutfitItem ──▶ ClothingItem
ClothingItem N─1 Category, Brand, Color
Product N─1 Category, Brand

AdminSetting, StyleRule, BlogPost, AuditLog, AnalyticsEvent — admin/ops tables
```

Full field-level schema: `prisma/schema.prisma`. Seed data (colors,
categories, brands, demo clothing items, demo outfits, demo users, admin
settings): `prisma/seed.ts`.

## 3. Core user flow

```
Homepage → "Try My Style" → /try
  → upload full-body photo (+ explicit AI-processing consent)
  → POST /api/photos/upload   (validate → quality check → encrypted storage)
  → POST /api/analysis        (creates AIGeneration job, status=QUEUED)
  → poll GET /api/analysis/:jobId  ("Creating your personal style profile...")
  → on COMPLETED → redirect to /style-profile
  → user reviews/edits Style + Fashion profile
  → /outfits, /colors, /jeans, /shirts, /tshirts, /look-builder, /chat, /shopping
```

Errors surface only as the safe, user-facing messages defined in
`lib/pipeline/steps.ts` / `lib/pipeline/types.ts` (e.g. "Please upload a
clear full-body photo.", "Please upload a photo with only one person.") —
raw provider/DB errors are logged server-side only (`lib/api-response.ts`).

## 4. AI generation job system

```
Frontend → POST /api/analysis | /api/try-on   (creates DB job row, QUEUED)
         → job runs (processAnalysisJob / processTryOnJob in lib/jobs/*)
         → status: QUEUED → PROCESSING → COMPLETED | FAILED
Frontend polls GET /api/analysis/:id | /api/try-on/:id every ~1s
Retry:   POST /api/analysis/:id/retry | /api/try-on/:id/retry
```

The reference implementation runs the job inline (fire-and-forget) on a
persistent Node server. For a serverless/multi-instance deployment, swap the
`void process*Job(id)` call for a real queue publish (BullMQ, Inngest, QStash,
or Next's `after()`) — the job functions themselves (`lib/jobs/*.ts`) are
already side-effect-isolated and queue-ready; no other code changes.

## 5. Computer vision pipeline

```
USER PHOTO
 → Image Validation        (lib/pipeline/steps.ts: validateImageFile)
 → Image Quality Check     (assessImageQuality — resolution + brightness via sharp)
 → Person Detection        (assertSinglePerson, via AIProvider.analyzeImage)
 → Segmentation             (runSegmentation)
 → Pose / Body Landmarks    (extractBodyProportions)
 → Clothing Detection       (extractDetectedClothing)
 → Style Analysis           (extractStyleAndColor)
 → Color Analysis           (services/color-engine.ts)
 → Recommendation Engine    (services/outfit-generator.ts, jeans-recommender.ts, top-recommender.ts)
 → Virtual Try-On           (AIProvider.virtualTryOn)
 → Result Validation        (job status COMPLETED/FAILED)
 → Final Image
```

Orchestrated end-to-end in `lib/pipeline/orchestrator.ts`. Each step is a
standalone, typed function — swapping the demo analysis for dedicated
person-detection/segmentation/pose models in production means implementing
those calls inside the relevant step function, not rewriting the pipeline.

## 6. AI abstraction layer

`ai/types.ts` defines `AIProvider`:

```ts
interface AIProvider {
  analyzeImage(input): Promise<ImageAnalysisResult>;
  virtualTryOn(input): Promise<VirtualTryOnResult>;
  generateImage(input): Promise<ImageGenerationResult>;
  recommendStyle(input): Promise<StyleRecommendationResult>;
  generateText(input): Promise<TextGenerationResult>;
}
```

- `ai/providers/demo-provider.ts` — deterministic, hash-seeded mock results.
  No network calls. This is DEMO MODE and is the default.
- `ai/providers/production-provider.ts` — real integrations: OpenAI
  (vision analysis, text generation, image generation) + Replicate
  (garment-aware virtual try-on). Fully documented, env-driven, and isolated
  — no other file imports a vendor SDK directly.
- `ai/index.ts` — `getAIProvider()` picks the active provider from
  `AI_PROVIDER` env var, falling back to demo if production credentials are
  missing.

## 7. API specification (summary)

| Area | Routes |
|---|---|
| Auth | `POST /api/auth/signup`, `/api/auth/[...nextauth]` (Auth.js) |
| Photos | `POST /api/photos/upload`, `GET /api/photos`, `DELETE /api/photos/:id`, `GET /api/files/:key` (signed) |
| Analysis job | `POST /api/analysis`, `GET /api/analysis/:jobId`, `POST /api/analysis/:jobId/retry` |
| Style profile | `GET/PATCH /api/style-profile` |
| Outfits | `POST /api/outfits/generate`, `POST /api/outfits/save` |
| Colors | `GET /api/colors`, `GET /api/colors/:colorId/outfits` |
| Jeans / Tops | `GET /api/recommendations/jeans`, `GET /api/recommendations/tops/:category` |
| Virtual try-on | `POST /api/try-on`, `GET /api/try-on/:sessionId`, `POST /api/try-on/:sessionId/retry` |
| Chat | `POST /api/chat` |
| Saved looks | `GET/POST/DELETE /api/saved-outfits` |
| Favorites | `GET/POST/DELETE /api/favorites` |
| Shopping | `GET /api/products`, `GET /api/catalog` |
| Subscription | `GET/POST /api/subscription` |
| Analytics | `POST /api/analytics` |
| Admin | `/api/admin/users`, `/clothing-items`, `/colors`, `/outfits`, `/style-rules`, `/settings`, `/products`, `/blog`, `/analytics` (all `requireAdmin`) |

Every handler validates input with `zod` (`lib/validation.ts`), authenticates
via `requireUser`/`requireAdmin` (`lib/session.ts`), and returns errors
through `apiError()` (`lib/api-response.ts`), which never leaks internals.

## 8. Folder structure

```
app/                    Next.js App Router — pages + API route handlers
  api/                  Route handlers (see §7)
  (pages)/              try, style-profile, outfits, colors, jeans, shirts,
                         tshirts, look-builder, virtual-try-on, chat,
                         shopping, dashboard, admin, blog, fashion-guide, ...
ai/                      AI abstraction layer (types + providers + registry)
services/                Business logic: recommendation engine, color engine,
                         style score, chat responder — no UI, no HTTP
lib/                      Cross-cutting: db, auth, storage, validation,
                         rate-limit, session, api-response, pipeline/, jobs/
components/
  ui/                    shadcn/ui-style primitives
  layout/                Navbar, Footer
  features/              Feature UI (try-flow, outfit-card, look-builder, ...)
  features/admin/        Admin panel tabs
hooks/                   React hooks (use-toast)
types/                   Shared ambient TypeScript types
prisma/                  schema.prisma + seed.ts
docs/                    This file
```

## 9. UI page map

| Route | Purpose |
|---|---|
| `/` | Homepage / hero / CTA |
| `/try` | Upload flow + AI analysis progress |
| `/style-profile` | Body/color/fashion profile, user-editable |
| `/virtual-try-on`, `/look-builder` | Item pickers + AI try-on preview + before/after + style score |
| `/outfits` | AI Outfit Generator (occasion/weather/style) |
| `/colors` | Color Recommendation Engine |
| `/jeans` | Jeans Stylist |
| `/shirts`, `/tshirts` | Top-specific stylists |
| `/chat` | AI Style Chat |
| `/shopping` | Shopping mode (budget/brand/color filters) |
| `/dashboard` | Profile, photos, style profile, saved looks, colors, history, wishlist, settings |
| `/admin` | Users, clothing, colors, outfits, style rules, AI settings, products, blog, analytics |
| `/fashion-guide`, `/blog`, `/blog/[slug]` | SEO content |
| `/privacy`, `/terms` | Legal |
| `/auth/signin`, `/auth/signup`, `/onboarding` | Auth |

## 10. Security & privacy

- Photos are private by default: encrypted-at-rest in S3 (`ServerSideEncryption: AES256`)
  or local disk, served only via time-limited signed URLs with an ownership
  check (`app/api/files/[...key]/route.ts`).
- Explicit consent is required before any AI processing (`consent=true` on
  upload; enforced server-side).
- User-controlled deletion: `DELETE /api/photos/:id` removes the storage
  object immediately.
- Rate limiting on upload, chat, signup, and analytics endpoints
  (`lib/rate-limit.ts`).
- Input validation via `zod` on every mutating endpoint.
- `middleware.ts` enforces auth on `/dashboard` and `/admin`, adds baseline
  security headers (X-Frame-Options, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy).
- Role-based access (`USER`/`ADMIN`) enforced server-side on every admin
  route via `requireAdmin()` — never trusted from the client.
- Admin mutations write to `AuditLog`.

## 11. Demo mode vs. production mode

| | Demo mode (default) | Production mode |
|---|---|---|
| AI provider | `DemoAIProvider` — deterministic, no network calls | `ProductionAIProvider` — real OpenAI + Replicate calls |
| Storage | Local disk, signed app-route URLs | S3-compatible object storage, presigned URLs |
| Catalog | Seeded via `prisma/seed.ts` | Same schema, real catalog managed via Admin Panel |
| Products (Shopping Mode) | Empty until an admin adds real products/affiliate feeds — **no fake inventory is hardcoded** | Connected to real store APIs / affiliate feeds |

Switching modes is an environment-variable change (`AI_PROVIDER`,
`S3_BUCKET`/credentials) — no code changes required.
