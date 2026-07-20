# CLAUDE.md — Nanalu Boutique (web)

Working guide for Claude (and us) in this repo. The product roadmap lives in **[PLAN.md](./PLAN.md)**.

> 🌱 **Living document.** This is the foundation — expand it as the project grows. Sections marked **TODO** get filled in after Phase 0 (the scaffold). Add architecture notes, gotchas, and "do X not Y" lessons here as we learn them.

---

## Project

Nanalu Boutique — a handmade-goods shop (sewn + some knit/crochet), sold **ready-made** and **made-to-order** via a visual fabric **configurator**. Custom build; also a portfolio piece. See **PLAN.md** for the full vision, the configurator design, and the phased roadmap.

Sibling repo: **`nanaluboutique/nanalu-app`** (future native app, dormant for now).

---

## Tech stack

**Decided:** TypeScript · Next.js (React) · Tailwind CSS · PostgreSQL · Prisma · shared API layer · **Cloudinary** image storage (swappable later via an image-access abstraction) · Stripe.
**Deferred:** hosting/deployment (build deployment-agnostic) · auth provider · Stripe integration style · storage migration (Cloudinary → S3-compatible).

_(Exact versions, configs, and rationale: **TODO after Phase 0**. Full reasoning is in PLAN.md §3.)_

---

## Workflow conventions

- **One issue → one branch.** Name: `type/<issue#>-short-slug`, where `type` ∈ `feat | fix | chore | docs`.
  e.g. `feat/12-product-carousel`.
- **One PR per issue.** PR body includes `Closes #<issue#>` and uses the PR template.
- **Review before merge** — the other sister and/or `/code-review`. Run **`/security-review`** on anything touching **auth, payments, or user data**.
- **Merge:** squash + delete branch.
- **AI agent — ask first.** Claude must get an explicit maintainer go-ahead before each **commit, push, PR creation, or merge** — never on its own initiative. Doing the work (edits, builds, lint/tests, creating branches, moving board cards) is fine without asking; "CI is green" / "approved" is **not** authorization to merge.
- **`main` is always deployable.** Don't commit directly to `main`.
- **Create issues via the `gh-issue-create` skill** → they auto-add to the Project board.
- **Commits:** concise, imperative ("add product carousel"), not "fixed stuff".
- **Definition of done:** builds, tests pass, CI green, reviewed, and the issue's acceptance criteria are met.

---

## Security (non-negotiable — see PLAN.md §4)

- **Card data never touches our servers** — it goes browser → Stripe; we store only tokens + "paid" confirmations.
- **Auth via a vetted provider; never hand-rolled.** Passwords hashed, never plaintext.
- **PII encrypted at rest; HTTPS everywhere.** Secrets live in env vars — **never committed**.
- Run **`/security-review`** before merging sensitive changes.

---

## Commands

Package manager is **npm** (committed `package-lock.json`). Node **24** (matches the Docker base image `node:24-alpine`, CI, and `.nvmrc`).

| Task             | Command          | Notes                                                                                        |
| ---------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| Install deps     | `npm install`    | `npm ci` for a clean, lockfile-exact install (what CI/Docker use).                           |
| Dev server       | `npm run dev`    | Next dev server on http://localhost:3000 (hot reload).                                       |
| Production build | `npm run build`  | Compiles to `.next/`; `output: "standalone"` emits a self-contained server (see Dockerfile). |
| Run built app    | `npm run start`  | Serves the production build; run `build` first.                                              |
| Lint             | `npm run lint`   | ESLint (flat config, `eslint.config.mjs`). `npm run lint:fix` to auto-fix.                   |
| Format           | `npm run format` | Prettier writes all files; `npm run format:check` only checks (used in CI).                  |

- **Pre-commit:** Husky + lint-staged auto-run `eslint --fix` + `prettier --write` on staged files (config in `package.json`). The `prepare` script installs the Husky hooks on `npm install`.
- **Tests:** _no test runner wired up yet._ The rollout is phased across three issues:
  1. **Runner setup — #52** (Vitest + React Testing Library + jsdom, `test` script, CI wiring). Prerequisite for all testing. Update this line once it lands.
  2. **Pure-function backfill — #53** (unit tests for `imageUrl()` and `priceCentsFor()` — deterministic, no DB/browser). Blocked by #52.
  3. **Deferred heavier layers — no issue yet, DON'T FORGET:**
     - **Component tests** (React Testing Library): our current components are thin wrappers (`AssetImage`) not worth unit-testing. **Resurface when** we ship components with real behaviour — the shop grid (#43), category filters/sort (#44), or the Phase 3 configurator. File the issue then.
     - **DB-integration tests** for the catalog queries (`listAvailablePieces`, `getProductBySlug`) — these need a throwaway test Postgres in CI, so they're a bigger lift. **Resurface when** we either stand up a test DB in CI or next touch query logic (pagination/filters in #44, or cart/checkout persistence later). File the issue then.

  Claude: proactively suggest opening the deferred issue(s) when work hits one of those triggers — don't wait to be asked.

### Database (local: Docker + Prisma)

Local dev DB is **PostgreSQL in a Docker container** (`docker-compose.yml`), accessed via **Prisma** (ORM). Needs Docker Desktop running.

| Task              | Command               | Notes                                                                                   |
| ----------------- | --------------------- | --------------------------------------------------------------------------------------- |
| Start DB          | `npm run db:up`       | Starts Postgres (detached) and waits until it accepts connections.                      |
| Stop DB           | `npm run db:down`     | Stops it; data persists in a named volume.                                              |
| Migrate (dev)     | `npm run db:migrate`  | Create + apply a migration from schema changes (`prisma migrate dev`).                  |
| Seed              | `npm run db:seed`     | Wipe + re-insert realistic dev data (`prisma db seed` → `prisma/seed.ts`). Re-runnable. |
| Studio            | `npm run db:studio`   | GUI to browse/edit data (`prisma studio`).                                              |
| Regenerate client | `npm run db:generate` | Rebuild the type-safe client into `src/generated/prisma`.                               |
| Reset (dev)       | `npm run db:reset`    | Wipe + replay all migrations. **Dev only — destroys data.**                             |
| Deploy migrations | `npm run db:deploy`   | Apply pending migrations without creating new ones (CI/prod).                           |

- **Source of truth:** `prisma/schema.prisma` (models); migrations live in `prisma/migrations/` (committed, replayable).
- **CLI config:** `prisma.config.ts` (Prisma 7) points the CLI at the schema/migrations and reads `DATABASE_URL` from `.env.local` (see Environment). Old tutorials put the `url` in `schema.prisma` — Prisma 7 moved it here.
- **Generated client:** output to `src/generated/prisma` (gitignored — regenerated, never committed).

## Project structure

```
src/
  app/                  # Next.js App Router — each folder is a route (page.tsx)
    layout.tsx          # root layout: fonts, <Header>, <main>, <Footer>, metadata
    page.tsx            # home (/)
    globals.css         # Tailwind v4 entry + @theme design tokens (source of truth for colors/fonts/radii)
    icon.svg            # favicon
    <route>/page.tsx    # one folder per route: shop, customize, cart, favorites,
                        #   account, faq, shipping, refunds, care-guide, contact,
                        #   terms, privacy, impressum, story, styleguide
  components/
    layout/             # structural: Header, Footer, Container, PlaceholderPage
    ui/                 # reusable primitives: Button, Card, Tag, Brand/logo, icons
  lib/
    cn.ts               # className joiner used across components
    image.ts            # asset-key → image URL helper (#31); the swappable-storage seam
    db.ts               # getPrisma() — the app's ONE Prisma client + connection pool (#41)
    catalog.ts          # catalog reads (list pieces, get product by slug) + the price rule (#41)
  generated/prisma/     # generated Prisma client (gitignored — not committed)
prisma/
  schema.prisma         # Prisma models — the DB source of truth
  migrations/           # generated SQL migrations (committed, replayable)
  seed.ts               # dev seed data (wipe + insert); run via `npm run db:seed`
prisma.config.ts        # Prisma 7 CLI config (schema/migrations paths, DB url via .env.local)
docker-compose.yml      # local Postgres container for dev
public/                 # static assets served at / (svgs, etc.)
docs/brand.md           # brand/visual spec (palette, type) — authority for design
docs/data-model.md      # ERD + rationale + decided/deferred data & catalog behaviour — authority for schema/browse decisions
mockups/*.html          # static HTML mockups — the visual spec for components
```

Conventions:

- **Path alias `@/*` → `src/*`** (set in `tsconfig.json`). Import as `@/components/ui/button`, not long relative paths.
- **Server Components by default.** A file needs `"use client"` only when it uses state, effects, or browser events (e.g. `header.tsx`).
- **Never hardcode hex** — pull colors/fonts/radii from the `@theme` tokens in `globals.css` (see "Frontend gotchas").
- **Images: store keys, render through `imageUrl()`.** The DB holds an asset **key** (e.g. `products/linen-tote/main`), never a full URL. Build every image URL via `imageUrl(key, opts?)` from `@/lib/image` — the single seam that keeps storage swappable (Cloudinary now, S3-compatible later; PLAN §4). Never hardcode `res.cloudinary.com` at a call site. Needs `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (public — it's in every delivered URL). The `next/image` wrapper + `remotePatterns` wiring lands in Phase 2, when the catalog renders real assets.

## Data access (#41)

- **One Prisma client, always via `getPrisma()`** from `@/lib/db`. **Never `new PrismaClient()` at a call site** — each one opens its own connection pool, and Postgres caps connections (~100) then refuses with _"too many clients already"_. `prisma/seed.ts` is the sole exception: it's a standalone script, not part of the running app. In dev, the client is stashed on `globalThis` so hot reload reuses it instead of leaking a pool per file save.
- **`getPrisma()` is lazy — a function, not an exported `prisma` const — and that's load-bearing.** `next build` imports every page module to collect its data, but a build never _queries_ the database, and neither the Dockerfile's builder stage nor CI sets `DATABASE_URL`. Creating (or validating) the client at import time therefore fails the build outright with `Failed to collect page data for /shop`. Keep the connection out of module scope so builds stay database-free — that portability is the point of the Docker path.
- **Queries live in `@/lib/catalog`, never in components.** Pages import `listAvailablePieces()` / `getProductBySlug()`; they don't touch `getPrisma()`. That way "what counts as a sellable piece?" (available piece **and** active parent) has exactly one answer. Same for `priceCentsFor()` — a piece's `priceCents` is a nullable **override** that falls back to the product's, and that rule must not be re-remembered in four places.
- **Always give `orderBy` a tiebreaker** (`[{ createdAt: "desc" }, { id: "desc" }]`). Sibling rows written by one nested `create` share an identical `createdAt`, and Postgres returns tied rows in arbitrary order — so a single-key sort reshuffles between page loads, and breaks outright under pagination.
- **`db.ts` imports `server-only`**, so a `"use client"` file importing the data layer fails the build with a clear message. It also can't be imported from a plain node/tsx script — verify data changes by driving the app, not with a standalone script.
- **Money is integer cents** end-to-end (`4800`, not `48.00`) — floats drift (`0.1 + 0.2 !== 0.3`) and must never reach a total. Format to "€48.00" only at render.

## Environment variables

- Real values live in **`.env.local`** (gitignored, **never committed**). `.env.example` is the committed template — copy it: `cp .env.example .env.local`.
- **`DATABASE_URL` is required now** (points at the local Docker Postgres). The rest of `.env.example` stays forward-looking placeholders (Cloudinary, Stripe, auth) until the code that reads them lands.
- **Both Next.js and Prisma read `.env.local`:** Next loads it automatically for the app; the Prisma CLI loads it via `prisma.config.ts` (it doesn't read `.env.local` on its own). So there's one local-env file, not two.
- **`NEXT_PUBLIC_` prefix** = exposed to the browser (e.g. Stripe _publishable_ key). Anything secret (DB URL, Stripe _secret_ key) must **not** carry that prefix — it stays server-only.
- When you add a new variable, add it to `.env.example` with a safe placeholder in the same change, so a fresh clone knows what to set.

## Deployment

**Hosting: Railway (current — not final).** Chosen over Vercel to keep the portable Docker path — Railway builds and runs our `Dockerfile` (the same image CI smoke-tests), so what's tested is what ships _and_ we stay free to move later (e.g. AWS / self-host). The final production host is revisited at launch (PLAN §Phase 11); the Docker/portable build is what keeps that option open. Deployed ahead of the original Phase 11 timeline so the app is reachable during development. Live at **https://nanaluboutique.com**.

### How it's wired

- **Build & deploy:** Railway auto-detects the `Dockerfile` and deploys the standalone image. Every push to `main` **auto-deploys** — continuous deployment layered on the CI we already had.
- **Port:** Railway injects its own `PORT` at runtime (currently `8080`); our `server.js` reads `process.env.PORT`, so it adapts on its own. The Dockerfile's `ENV PORT=3000` / `EXPOSE 3000` are only **local defaults** — Railway overrides them, so `EXPOSE 3000` is cosmetic there. Never hardcode a port in server code; always read `process.env.PORT`.
- **Database:** a Railway **Postgres** service in the same project. The app reads it via a **reference variable** — `DATABASE_URL = ${{Postgres.DATABASE_URL}}` — which resolves to the **private** hostname (`postgres.railway.internal`): fast, and no egress fees. Don't paste a raw connection string into the app's `DATABASE_URL`; use the reference.
- **Migrations:** a `railway.json` **pre-deploy command** (`npx prisma migrate deploy`) applies pending migrations before each new version serves — see "Running migrations & seed" below.
- **Custom domain (Porkbun):** the root `nanaluboutique.com` points at Railway with an **ALIAS** record — _not_ a CNAME (the bare apex can't hold a CNAME; ALIAS is the apex-safe equivalent Porkbun provides) — plus a `_railway-verify` **TXT** record for ownership + SSL issuance. The free `*.up.railway.app` URL stays as a dev fallback / diagnostic.

### Running migrations & seed against production

**Migrations auto-apply on every deploy.** `railway.json` sets a **pre-deploy command** — `npx prisma migrate deploy` — that Railway runs in a one-off instance of the new image _before_ it takes traffic, using the **private** `DATABASE_URL` reference (internal network, no egress). If it fails, the deploy halts, so an un-migrated schema never serves new code. The runtime image carries what this needs — the Prisma CLI + `dotenv` + `prisma/` — copied in via the Dockerfile's `migrate-deps` stage (which adds the ~200 MB Prisma engine toolchain: the cost of migrating in-image). `migrate deploy` is idempotent, so deploys with no new migration just no-op. (#49)

**Seeding stays manual — never automate it; it WIPES tables.** Run it from your machine, pointed at Postgres's **public** URL — the private `.railway.internal` host only resolves _inside_ Railway:

1. Copy **`DATABASE_PUBLIC_URL`** from the Postgres service → **Variables** (its host ends in `.proxy.rlwy.net`).
2. Pass it inline — `dotenv` won't override an already-set variable, so this cleanly beats the local value in `.env.local`:
   ```bash
   DATABASE_URL="postgresql://…proxy.rlwy.net:PORT/railway" npm run db:seed   # re-runnable: WIPES + reseeds
   ```

The public endpoint's egress is billed but negligible for a one-off seed; the auto-migration and the running app both use the free private URL. You can still run `npm run db:deploy` this same manual way if you ever need to migrate out-of-band.

### Gotchas

- **`NEXT_PUBLIC_*` bake at _build_ time.** Vars like `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` are inlined into the JS during `next build`, not read at runtime — so on Railway they must be set as **build** variables, not only runtime ones, or the bundle carries a stale/empty value. (Harmless until Phase 2 renders a real image.)
- **Billing — don't let the trial lapse.** We're on Railway's one-time **$5 free trial**. Move to the **Hobby plan (~$5/mo)** before it runs out, or the app goes offline — which defeats the point of it being reachable.
- **Two URLs → duplicate content at launch.** The `*.up.railway.app` fallback serves the same site as the custom domain, which splits search ranking. At launch, remove it or **301-redirect** it to `nanaluboutique.com`. Tracked in the **Phase 10 SEO pass**.

## Frontend gotchas / lessons

- **Don't force `-webkit-font-smoothing: antialiased`** (the `antialiased` class `create-next-app` puts on `<html>`, or the equivalent CSS). It's a **macOS-only** override that switches text to grayscale smoothing, rendering the same font weight **thinner** than the OS default — making the app look lighter than our mockups (which were authored without it). We render at the platform default instead. Only consider re-adding it locally for **light-text-on-dark** UI, where the default can look too heavy. (Removed in #9.)
- **Mockups are the spec, not a starting point.** `docs/brand.md` + `mockups/*.html` hold exact values (padding, line-height, transitions, hex). When porting a component, copy the mockup CSS verbatim — don't "improve" it. The base UI primitives live in `src/components/ui` and pull from `@theme` tokens in `globals.css`; never hardcode hex.
- **Where design decisions live — read before scoping.** Two authorities, and they don't overlap: **`mockups/*.html` + `docs/brand.md`** own the _visual_ spec (layout, spacing, colour). **`docs/data-model.md`** owns the _data shape + browse/catalog behaviour_ (what a card represents, what's grouped, what's deferred) — and it deliberately diverges from the mockup in places. On any structural/data/browse question, **`docs/data-model.md` wins over the mockup.** Read it before scoping catalog, product, or schema work; don't re-open questions it has already settled. (e.g. the catalog shows one card per in-stock `ReadyMadeItem`, not one per `Product` — decided there, not in the mockup.)
