# Nanalu Boutique — Project Plan

> **What this is:** the high-level roadmap for building the Nanalu Boutique website — from empty repo to launched shop, in build order. Each phase is intentionally high-level; we refine one phase at a time into individual GitHub issues (via the create-issue skill) when we reach it.
>
> **Last updated:** 2026-06-08

---

## 1. Vision

Nanalu Boutique is a handmade-goods shop run by two sisters, selling **sewn products** plus a few **knit/crochet** pieces. Items are sold two ways:

1. **Ready-made** — one-of-a-kind, in-stock pieces, bought immediately.
2. **Made-to-order / customizable** — the buyer designs their own version in a visual configurator, choosing which fabrics/colors go where on the product, at a fixed per-product price.

The site is a **custom build** (the configurator + meterage-based inventory can't run on an off-the-shelf platform), and is also a **portfolio piece**. A **native app** will follow later in a separate repo (`nanaluboutique/nanalu-app`).

---

## 2. The configurator (the core, distinctive feature)

- Each customizable product has an **outline (SVG)** divided into fillable **regions**.
- Regions are grouped into **slots** (e.g. *top*, *bottom*); filling one region fills every region in its slot — so "this fabric appears in several places" works automatically. Slots are defined in admin.
- The buyer picks a **material** and "paint-buckets" it into a slot:
  - **Patterned fabric** → rendered as a tiled SVG pattern of the calibrated swatch image, **at real-world scale** (a 1 cm flower reads as 1 cm on a 10 cm product).
  - **Solid color** (for any color-only knit/crochet) → a flat fill; no scale/tiling needed.
- A **live preview** + a **fixed product price** (balanced across fabrics, like flat-priced clothing sizes — fabric choice does **not** change price).
- **Stock handling:** adding to cart **reserves** material/stock temporarily; it is **deducted on payment confirmation** (not at fulfillment/shipping). The **meterage** each slot consumes is defined per product/slot in admin; **refunds/cancellations restock** it.

**Scale accuracy** relies on calibrated swatches → we'll build a **Fabric Calibration Tool** in admin (upload swatch → drag a line over a known ruler length → it computes real-world scale; optionally mark the repeat tile; live preview before saving).

---

## 3. Tech stack

**Decided:**

| Layer | Choice | Notes |
|---|---|---|
| Language | **TypeScript** | Shared across web + future app (assumes the app is **React Native** — our lean; see Phase 12) |
| Web framework | **Next.js (React)** | SEO, image optimization, can serve the API |
| Styling | **Tailwind CSS** | Custom handmade-brand design, not a template |
| Database | **PostgreSQL** | Relational + transactional (stock safety) |
| ORM | **Prisma** | Type-safe queries + migrations |
| API | **Shared API layer** (Next.js) | Built so the future native app reuses it |
| Image storage | **Cloudinary** (start) | Fast for our image-heavy configurator: uploads + on-the-fly transforms + CDN. Swappable later to an **S3-compatible** store — *not necessarily AWS* (e.g. Cloudflare R2, Supabase Storage) — via the image-access abstraction (§4) |
| Payments | **Stripe** (+ possibly PayPal later) | Card data never touches our servers |

**Deferred (decide at the relevant phase):**

- **Hosting / deployment** — managed (Vercel) vs **AWS** vs **self-hosted**. DevOps available; decision depends on cost. → We build **deployment-agnostic** (Dockerizable Next.js `output: 'standalone'`; portable Postgres + S3-compatible storage) so this stays fully open.
- **Auth provider** — Auth.js (self-hostable) vs Supabase Auth vs Clerk. Must support **email/password + social login** (Google/Apple/etc.).
- **Stripe integration style** — Stripe Checkout (hosted) vs Payment Element (embedded).
- **Storage migration** — if/when we outgrow Cloudinary or move to AWS/self-host, migrate to an S3-compatible store (Cloudflare R2 / Supabase / Backblaze / S3). Kept cheap by the image-access abstraction. Decide later — **not** an AWS commitment.

---

## 4. Architectural principles

- **Security-first, woven through every phase** (not bolted on at the end):
  - Card data goes **browser → Stripe** directly; we store only tokens + "paid" confirmations (minimal PCI scope).
  - Auth handled by a vetted provider; **never hand-rolled**. Passwords hashed, never stored in plaintext.
  - PII (addresses, etc.) encrypted at rest; HTTPS everywhere; least-privilege access.
- **Deployment-agnostic** — no hard lock-in to one host (see deferred hosting).
- **Swappable storage** — store image asset *keys* (not full provider URLs) in the DB and load every image through **one helper**, so we can move from Cloudinary to an S3-compatible store later with minimal churn. (The only real migration cost is re-creating Cloudinary's on-the-fly *transforms*, not the files.)
- **App-ready API** — the website and the future native app share one backend.
- **i18n-ready** — English first, but centralize copy so languages can be added later without a rewrite.
- **Quality + learnability** — mainstream, well-documented tools; decisions explained as we go (one of us is junior, by design no compromise on quality).

---

## 5. Roadmap (build order)

> Phases are sequenced by dependency. Security, accessibility, and tests are **cross-cutting** — addressed within every phase, with a dedicated hardening pass near the end.

### Phase 0 — Foundations & project setup
- Next.js + TypeScript + Tailwind scaffold; ESLint/Prettier; CI (GitHub Actions).
- Dockerizable build (`output: 'standalone'`) from day one for deployment portability.
- Design-system foundations: brand identity, color tokens, typography, base components, layout shell, routing structure.
- **Outcome:** a running, styled, empty app that deploys anywhere.

### Phase 1 — Domain model & database
- Design the schema: **Products**, **ReadyMadeItems** (unique in-stock iterations), **Materials** (fabric *or* color; per-material unit — meterage / skein / grams; swatch + real-world scale), **CustomizationConfig** (regions, slots, region↔slot mapping, meterage per slot), **Orders / OrderItems**, **Reservations** (with expiry), **Users/Customers**.
- Prisma setup + migrations + **seed data** (so UI can be built against realistic data).
- **Image-access abstraction**: store asset keys (not provider URLs); one helper builds image URLs (Cloudinary now, swappable later).
- **Outcome:** the data backbone everything else builds on.

### Phase 2 — Catalog & product browsing (customer, read-only)
- Home/catalog page: product grid, **filtering**, optional **search**.
- Product page: image **carousel**, product info, **in-stock iterations** as thumbnails → **quick-view modal** (more photos + that piece's fabric info), **Customize** button or "not customizable" note.
- Footer scaffold with (placeholder) legal/info links.
- Built against seeded data (login/favorites/cart **stubbed** for now).
- **Outcome:** customers can browse the shop.

### Phase 3 — The customization configurator (centerpiece) 🧶
- SVG outline + regions + slots; material picker; **paint-bucket fill**.
- Patterned fabric (tiled, **real-world scale**) and solid-color paths.
- Live preview + fixed price; "add customized item to cart".
- **Outcome:** the signature feature works end-to-end (minus payment).

### Phase 4 — Cart & stock reservations
- Cart page + **hover/slide-out sidebar** preview.
- **Reservation/hold system**: adding to cart reserves stock for X minutes; expiry releases it; cleanup job; **re-check at checkout** with "this fabric is now out of stock" handling.
- **Outcome:** a working cart that protects one-of-a-kind stock.

### Phase 5 — Checkout & payments (Stripe)
- **Guest checkout** (account optional); shipping/contact capture.
- Stripe integration; **webhook = source of truth for "paid"** → create order, **deduct stock/meterage** (converts the reservation into an actual deduction), send confirmation.
- **Outcome:** customers can actually buy (ready-made + customized).

### Phase 6 — Authentication & customer accounts
- **Email/password + social login** (provider chosen here).
- Wire up the previously-stubbed **login** and **favorites**; **order history**.
- Secure session handling.
- **Outcome:** real accounts; foundation reused by admin.

### Phase 7 — Admin: products & inventory
- **Secure admin login**.
- Product CRUD (info, photos, in-stock iterations); customization config (outline, slots, meterage per slot).
- Materials/fabrics/yarn CRUD + **stock**, plus the **Fabric Calibration Tool**.
- **Outcome:** the sisters can manage the real catalog + stock (replaces seed data).

### Phase 8 — Admin: orders & fulfillment
- Order dashboard: incoming paid orders, customer/shipping details, status flow (*new → in progress → shipped → done*).
- **Refunds/cancellations** (which **restock** materials); (later) shipping labels.
- *(Note: stock was already deducted at payment in Phase 5 — fulfillment here is about status & exceptions, not deduction.)*
- **Outcome:** day-to-day fulfillment is runnable.

### Phase 9 — Legal, content & trust
- **Impressum**, **Privacy/GDPR**, **cookie consent**, **T&C**, **shipping info**, **refunds/returns** — including the **EU right-of-withdrawal exemption for custom-made goods** (surfaced on the configurator and/or at checkout).
- **FAQ**, **knit/crochet care guide** (footer + on product pages + order email), **About / "the two sisters"** story.
- **Outcome:** legally sound + trustworthy.

### Phase 10 — Polish, security hardening, SEO & performance
- Dedicated **security audit/hardening** pass; accessibility pass.
- SEO (metadata, sitemap, structured data), analytics, performance/image optimization, error monitoring.
- **Outcome:** launch-ready quality.

### Phase 11 — Launch
- Finalize **hosting decision** with DevOps (AWS / self-host / managed); production env + secrets; backups; monitoring; go-live.
- **Outcome:** Nanalu Boutique is live. 🎉

### Phase 12 — Native app *(future, separate repo)*
- React Native (Expo) consuming the shared API.

---

## 6. Cross-cutting concerns (every phase)

- **Security** — see principles; dedicated pass in Phase 10.
- **Accessibility** — semantic markup, keyboard/focus, contrast.
- **Testing** — meaningful tests as features land (not retrofitted).
- **Responsive design** — mobile-first (a real mobile web experience even before the native app).
- **SEO** — sensible from the start; deepened in Phase 10.

---

## 7. Parked suggestions (revisit later)

About/story page (in Phase 9), customer **reviews/testimonials**, **lead-time messaging** ("ships in ~2 weeks"), customer-facing **order-status tracking**, **gift note** option, **newsletter** signup, **Instagram feed** embed.

---

## 8. How we work

- High-level plan here → refine **one phase at a time** into GitHub issues (create-issue skill) when we reach it.
- Issues land on the **Project board** (auto-added) and filter by repo via the **Web** / **App** views.
- Work on branches → PRs (preview deploys) → review → merge.
- `CLAUDE.md` (the in-repo working guide: stack, commands, conventions) gets written **after Phase 0**, once the scaffold exists, and will link back to this plan.

---

## 9. Decision log

**Decided:** custom build · two-repo split (web now, app later) · stack in §3 · fixed price per customizable product · **stock reserved at add-to-cart, deducted on payment confirmation** (refunds/cancellations restock) · guest checkout allowed · quick-view modal for in-stock iterations · English first (i18n-ready) · Stripe (no card data on our servers) · deployment-agnostic · **start with Cloudinary** for image storage (swappable to S3-compatible later via the image-access abstraction; not an AWS commitment) · React Native as the app lean · scale-accurate fabric fills + calibration tool.

**Deferred:** hosting/deployment target · auth provider · Stripe integration style · storage migration (Cloudinary → S3-compatible) · adding more languages · PayPal.
