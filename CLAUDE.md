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

Package manager is **npm** (committed `package-lock.json`). Node **20+** (matches the Docker base image `node:20-alpine`).

| Task             | Command          | Notes                                                                                        |
| ---------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| Install deps     | `npm install`    | `npm ci` for a clean, lockfile-exact install (what CI/Docker use).                           |
| Dev server       | `npm run dev`    | Next dev server on http://localhost:3000 (hot reload).                                       |
| Production build | `npm run build`  | Compiles to `.next/`; `output: "standalone"` emits a self-contained server (see Dockerfile). |
| Run built app    | `npm run start`  | Serves the production build; run `build` first.                                              |
| Lint             | `npm run lint`   | ESLint (flat config, `eslint.config.mjs`). `npm run lint:fix` to auto-fix.                   |
| Format           | `npm run format` | Prettier writes all files; `npm run format:check` only checks (used in CI).                  |

- **Pre-commit:** Husky + lint-staged auto-run `eslint --fix` + `prettier --write` on staged files (config in `package.json`). The `prepare` script installs the Husky hooks on `npm install`.
- **Tests:** _no test runner wired up yet._ When we add one (e.g. Vitest/Playwright), add a `test` script and document it here.

### Database (local: Docker + Prisma)

Local dev DB is **PostgreSQL in a Docker container** (`docker-compose.yml`), accessed via **Prisma** (ORM). Needs Docker Desktop running.

| Task              | Command               | Notes                                                                  |
| ----------------- | --------------------- | ---------------------------------------------------------------------- |
| Start DB          | `npm run db:up`       | Starts the Postgres container (detached).                              |
| Stop DB           | `npm run db:down`     | Stops it; data persists in a named volume.                             |
| Migrate (dev)     | `npm run db:migrate`  | Create + apply a migration from schema changes (`prisma migrate dev`). |
| Studio            | `npm run db:studio`   | GUI to browse/edit data (`prisma studio`).                             |
| Regenerate client | `npm run db:generate` | Rebuild the type-safe client into `src/generated/prisma`.              |
| Reset (dev)       | `npm run db:reset`    | Wipe + replay all migrations. **Dev only — destroys data.**            |
| Deploy migrations | `npm run db:deploy`   | Apply pending migrations without creating new ones (CI/prod).          |

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
  generated/prisma/     # generated Prisma client (gitignored — not committed)
prisma/
  schema.prisma         # Prisma models — the DB source of truth
  migrations/           # generated SQL migrations (committed, replayable)
prisma.config.ts        # Prisma 7 CLI config (schema/migrations paths, DB url via .env.local)
docker-compose.yml      # local Postgres container for dev
public/                 # static assets served at / (svgs, etc.)
docs/brand.md           # brand/visual spec (palette, type) — authority for design
mockups/*.html          # static HTML mockups — the visual spec for components
```

Conventions:

- **Path alias `@/*` → `src/*`** (set in `tsconfig.json`). Import as `@/components/ui/button`, not long relative paths.
- **Server Components by default.** A file needs `"use client"` only when it uses state, effects, or browser events (e.g. `header.tsx`).
- **Never hardcode hex** — pull colors/fonts/radii from the `@theme` tokens in `globals.css` (see "Frontend gotchas").

## Environment variables

- Real values live in **`.env.local`** (gitignored, **never committed**). `.env.example` is the committed template — copy it: `cp .env.example .env.local`.
- **`DATABASE_URL` is required now** (points at the local Docker Postgres). The rest of `.env.example` stays forward-looking placeholders (Cloudinary, Stripe, auth) until the code that reads them lands.
- **Both Next.js and Prisma read `.env.local`:** Next loads it automatically for the app; the Prisma CLI loads it via `prisma.config.ts` (it doesn't read `.env.local` on its own). So there's one local-env file, not two.
- **`NEXT_PUBLIC_` prefix** = exposed to the browser (e.g. Stripe _publishable_ key). Anything secret (DB URL, Stripe _secret_ key) must **not** carry that prefix — it stays server-only.
- When you add a new variable, add it to `.env.example` with a safe placeholder in the same change, so a fresh clone knows what to set.

## Deployment

**TODO (Phase 11)** — depends on the deferred hosting decision; keep the build deployment-agnostic (Dockerizable, portable Postgres + S3-compatible storage) until then.

## Frontend gotchas / lessons

- **Don't force `-webkit-font-smoothing: antialiased`** (the `antialiased` class `create-next-app` puts on `<html>`, or the equivalent CSS). It's a **macOS-only** override that switches text to grayscale smoothing, rendering the same font weight **thinner** than the OS default — making the app look lighter than our mockups (which were authored without it). We render at the platform default instead. Only consider re-adding it locally for **light-text-on-dark** UI, where the default can look too heavy. (Removed in #9.)
- **Mockups are the spec, not a starting point.** `docs/brand.md` + `mockups/*.html` hold exact values (padding, line-height, transitions, hex). When porting a component, copy the mockup CSS verbatim — don't "improve" it. The base UI primitives live in `src/components/ui` and pull from `@theme` tokens in `globals.css`; never hardcode hex.
