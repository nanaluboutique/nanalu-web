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

*(Exact versions, configs, and rationale: **TODO after Phase 0**. Full reasoning is in PLAN.md §3.)*

---

## Workflow conventions

- **One issue → one branch.** Name: `type/<issue#>-short-slug`, where `type` ∈ `feat | fix | chore | docs`.
  e.g. `feat/12-product-carousel`.
- **One PR per issue.** PR body includes `Closes #<issue#>` and uses the PR template.
- **Review before merge** — the other sister and/or `/code-review`. Run **`/security-review`** on anything touching **auth, payments, or user data**.
- **Merge:** squash + delete branch.
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

**TODO after Phase 0** — install, dev server, build, test, lint/format, DB migrate, seed.

## Project structure

**TODO after Phase 0** — folder layout + where things live.

## Environment variables

**TODO** — documented as we add them (never commit real values; keep a `.env.example`).

## Deployment

**TODO (Phase 11)** — depends on the deferred hosting decision; keep the build deployment-agnostic (Dockerizable, portable Postgres + S3-compatible storage) until then.
