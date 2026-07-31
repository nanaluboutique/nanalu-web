# Data model (ERD) — Nanalu Boutique

The database sketch for **Phase 1**. We build it **incrementally by domain slice**:

1. **Catalog** — `#27` — the read-side data the shop renders.
2. **Customization** — `#28` — the configurator (regions, slots, meterage).
3. **Commerce** — `#29` — orders, stock holds, accounts.

> This is the "sketch before coding" the issue asks for: entities + relationships
> first, field-level detail firmed up as each slice is built. It's a **living doc** —
> update it as the model grows.

Cardinality shorthand: `||` = one, `<`/`>` = many. So `A ||──< B` reads "one A, many B."

---

## The whole picture (Phase 1)

```
                          CATALOG  (#27 — built now)
   Category  >─────< Product  ||─────< ReadyMadeItem
   (M:N, admin      (the shared        (unique one-of-a-kind
    multi-tag)       listing)           in-stock items)

                     Material   ← defined standalone now; its relations
                     (fabric OR   arrive with the configurator (#28)
                      colour)

                          CUSTOMIZATION  (#28 — built now)
   Product ||──o| CustomizationConfig ||──< Slot ||──< Region
                                          Slot >──< Material  (allowed palette;
                                          meterage lives on the Slot itself)

                          COMMERCE  (#29 — built now)
   User ||──< Order ||──< OrderItem  ──> Product / ReadyMadeItem
   Order ||──< Reservation  ──> Material   (temporary meterage hold, has expiry;
                                            made-to-order ONLY)
   User >──< Product   (favourites — powers the "Most loved" sort)
```

---

## Catalog slice (#27) — detail

### Product — the shared listing

One row per thing sold (e.g. "Linen Tote Bag"). Umbrella for **both** buying paths:
a product can have ready-made items in stock **and** offer customization.

| Field            | Type            | Notes                                                              |
| ---------------- | --------------- | ------------------------------------------------------------------ |
| `id`             | String (cuid)   | primary key; random, not sequential (doesn't leak catalog size)    |
| `createdAt`      | DateTime        | set once — powers the **"Newest"** sort                            |
| `updatedAt`      | DateTime        | auto-bumped on edit (bookkeeping)                                  |
| `name`           | String          |                                                                    |
| `slug`           | String @unique  | URL handle (`/shop/linen-tote`)                                    |
| `description`    | String          | the **shared/general** blurb (true of every item)                  |
| `care`           | String?         | care instructions; **nullable**; `ReadyMadeItem.care` can override |
| `dimensions`     | String?         | size/measurements — the product's shape, so **no item override**   |
| `priceCents`     | Int             | money as **integer cents** (no float bugs; Stripe-ready)           |
| `images`         | String[]        | Cloudinary ids; feeds the carousel                                 |
| `customizable`   | Boolean         | offers the configurator? drives the _Customize_ button + filter    |
| `active`         | Boolean         | soft-delete: `false` = discontinued (consistent with `Material`)   |
| `categories`     | Category[]      | **M:N** — see below                                                |
| `readyMadeItems` | ReadyMadeItem[] | **1:N** — see below                                                |

### Category — admin-managed product tags

Small table of browse buckets (Bags & totes, Pouches, Home, Knitwear, Accessories).
**Admin can add / edit / delete** them, so it's a table (not an enum).

| Field                     | Type           | Notes                                     |
| ------------------------- | -------------- | ----------------------------------------- |
| `id`                      | String (cuid)  |                                           |
| `createdAt` / `updatedAt` | DateTime       | admin-managed, so track when added/edited |
| `name`                    | String         |                                           |
| `slug`                    | String @unique | filter/URL key                            |
| `products`                | Product[]      | **M:N** back to Product                   |

### ReadyMadeItem — a unique in-stock item

A single one-of-a-kind finished object under a Product (**qty always 1** — so no quantity
field; a item is simply available or gone).

| Field                     | Type              | Notes                                                                     |
| ------------------------- | ----------------- | ------------------------------------------------------------------------- |
| `id`                      | String (cuid)     |                                                                           |
| `createdAt` / `updatedAt` | DateTime          |                                                                           |
| `productId`               | String            | **FK column** — the 1:N link back to Product                              |
| `product`                 | Product @relation | doorway to parent (`fields: [productId]`, `onDelete: Cascade`)            |
| `images`                  | String[]          | this item's own gallery (quick-view + the card swatch image)              |
| `description`             | String            | **this item's** blurb: fabric + any one-off quirks (material-as-**text**) |
| `care`                    | String?           | **optional override**; falls back to `product.care` (like `priceCents`)   |
| `priceCents`              | Int?              | **optional override**; falls back to `product.priceCents`                 |
| `available`               | Boolean           | `true` = for sale · `false` = sold (first-come; re-checked at checkout)   |

The broad description lives on `Product`; the item's `description` is what makes _this_
item distinct. The UI shows both by reading `item.product.description` through the relation
(not duplicated onto the item).

**Care follows the same override pattern as `priceCents`.** An item made in a different
material (a wool version of a cotton product) can set its own `care`; otherwise it inherits
`product.care`. The fallback rule lives in one place — `careFor(item, product)` in
`lib/catalog.ts`, beside `priceCentsFor`. **`dimensions` stays product-level** (no item
override): a product's shape is the same across its items. Both new fields are **nullable**,
and the product page hides the matching accordion section when empty — so "not written yet"
shows nothing rather than an empty heading. (Added with the product page, #45.)

### Material — fabric OR colour

**One table** for both variants, discriminated by `kind` — chosen over two tables because
a material is referenced _interchangeably_ everywhere (picker, slots, reservations), so a
single `materialId` beats a polymorphic "fabric-or-colour" reference. Variant-specific
columns are nullable.

| Field                     | Type          | Notes                                                                    |
| ------------------------- | ------------- | ------------------------------------------------------------------------ |
| `id`                      | String (cuid) |                                                                          |
| `createdAt` / `updatedAt` | DateTime      |                                                                          |
| `kind`                    | MaterialKind  | `FABRIC` or `COLOUR` — the discriminator                                 |
| `name`                    | String        |                                                                          |
| `unit`                    | MaterialUnit  | `METRE / SKEIN / GRAM` — how stock is measured                           |
| `stock`                   | Decimal(10,2) | quantity on hand, in `unit` (bounded precision — exact, no float drift)  |
| `active`                  | Boolean       | soft-delete: `false` = discontinued (keeps historical refs valid)        |
| `swatchImage`             | String?       | **fabric-only** — Cloudinary id of the calibrated swatch                 |
| `swatchRealWidthCm`       | Decimal?(6,2) | **fabric-only** — real-world width the swatch spans (calibration output) |
| `hex`                     | String?       | **colour-only** — e.g. `#C48B9F`                                         |

A repeat-tile marker for patterned fabrics is deferred to the Calibration Tool. The
configurator relations below (`Material ⇄ Slot`) landed with #28.

---

## Customization slice (#28) — detail

How a customizable product is divided into fillable areas, so the Phase 3 configurator
can let buyers paint fabrics into place and we can compute what each choice consumes.

### CustomizationConfig — the per-product setup

One row per customizable product (`1:1`, optional side — a non-customizable product has
none). Holds the SVG outline; its slots hang off it.

| Field       | Type              | Notes                                                       |
| ----------- | ----------------- | ----------------------------------------------------------- |
| `id`        | String (cuid)     |                                                             |
| `productId` | String @unique    | **FK + unique** — enforces the 1:1 with Product             |
| `product`   | Product @relation | `onDelete: Cascade` — delete the product, the config goes   |
| `svg`       | String            | the outline markup; its `<path>` ids are what Regions match |
| `slots`     | Slot[]            | **1:N** — the fillable areas                                |

### Slot — a fillable area

A named area of the product ("Body", "Handles"). Painting it fills **all** its regions and
consumes `quantity` of the chosen material.

| Field       | Type          | Notes                                                           |
| ----------- | ------------- | --------------------------------------------------------------- |
| `id`        | String (cuid) |                                                                 |
| `configId`  | String        | **FK** back to CustomizationConfig (`onDelete: Cascade`)        |
| `name`      | String        | admin label ("Body", "Handles")                                 |
| `quantity`  | Decimal(10,2) | consumed per fill, in `unit` — the number #29 reserves/deducts  |
| `unit`      | MaterialUnit  | `METRE / SKEIN / GRAM` — matches the palette's materials        |
| `regions`   | Region[]      | **1:N** — the SVG paths this slot fills                         |
| `materials` | Material[]    | **M:N** — the allowed palette (implicit `_MaterialToSlot` join) |

**Meterage lives on the Slot, not the palette.** The amount is a property of the pattern
item ("the body panel needs ~0.5 m"), the same whichever allowed material you pick — like a
sewing pattern's fabric-requirements line. A slot's palette is homogeneous in unit (a fabric
area takes fabrics; a yarn area takes yarn), so one `quantity` + `unit` on the slot is exact
without a number per (slot × material). If a slot ever needs per-material amounts, moving
`quantity` onto the join is an additive migration (cheap while it's all seed data).

### Region — one fillable SVG path

A single paintable path, mapped to a Slot. Filling the slot fills every region under it —
so "one fabric appears in several places" works automatically.

| Field    | Type          | Notes                                              |
| -------- | ------------- | -------------------------------------------------- |
| `id`     | String (cuid) |                                                    |
| `slotId` | String        | **FK** back to Slot (`onDelete: Cascade`)          |
| `svgId`  | String        | the `id` attribute of the `<path>` in `config.svg` |

---

## Commerce slice (#29) — detail

Orders, the stock holds that protect made-to-order meterage, and customer accounts — the
data Phases 4–6 (cart, checkout, accounts) depend on. Built now as the schema foundation;
the _behaviour_ (reservation sweeps, webhook order creation, refund processing) lands in
its phase — this slice just makes the entities correct.

### User — a customer account

Identity + favourites only. **No auth columns yet** — password hashing / provider ids
arrive in **Phase 6** with a vetted provider (we never hand-roll auth). Orders can exist
**without** a user (guest checkout), so the account link is a nullable `Order.userId`, not a
requirement here.

| Field                     | Type           | Notes                                                                                                                    |
| ------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `id`                      | String (cuid)  |                                                                                                                          |
| `createdAt` / `updatedAt` | DateTime       |                                                                                                                          |
| `email`                   | String @unique | login handle + **claims past guest orders**; **lowercase-normalised** in app (the `@unique` is case-sensitive at the DB) |
| `name`                    | String?        |                                                                                                                          |
| `orders`                  | Order[]        | **1:N**                                                                                                                  |
| `favourites`              | Product[]      | **M:N** — powers the **"Most loved"** sort (implicit join)                                                               |

### Order — one purchase

Created **on payment confirmation** (Stripe webhook = source of truth) — the webhook writes
the order straight to **`PAID`**. Snapshots what was charged; **no card data** — only the
PaymentIntent reference. (`PENDING` is the enum's default but is **never persisted** today;
it's reserved for a possible future checkout-initiated flow.)

| Field                     | Type            | Notes                                                                         |
| ------------------------- | --------------- | ----------------------------------------------------------------------------- |
| `id`                      | String (cuid)   |                                                                               |
| `createdAt` / `updatedAt` | DateTime        | `createdAt` also anchors the grace-period clock                               |
| `userId`                  | String?         | **FK**, nullable — `null` = guest checkout (`onDelete: SetNull`)              |
| `email`                   | String          | receipt/contact + guest-order claim key; **lowercase-normalised** in app      |
| `status`                  | OrderStatus     | created as `PAID`; then `FULFILLED / CANCELLED / REFUNDED` (`PENDING` unused) |
| `totalCents`              | Int             | snapshot of the amount charged (integer cents)                                |
| `stripePaymentIntentId`   | String? @unique | the **only** payment data we keep; `@unique` = idempotent webhook handling    |
| `productionStartedAt`     | DateTime?       | **the cancel/restock gate** — see decisions below                             |
| `items`                   | OrderItem[]     | **1:N**                                                                       |
| `reservations`            | Reservation[]   | **1:N** — the holds this order consumed                                       |

### OrderItem — one line

Handles **both** buying paths through nullable FKs — **exactly one** of `readyMadeItemId`
(ready-made) / `productId` (made-to-order) is set, enforced by a `CHECK` constraint (Prisma
can't express it, so it's hand-written in the migration). FKs are `SetNull` so **order
history outlives catalog deletion**; name + price are **snapshotted** so later catalog edits
never rewrite the past.

| Field                | Type          | Notes                                                                                         |
| -------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| `id`                 | String (cuid) |                                                                                               |
| `orderId`            | String        | **FK** back to Order (`onDelete: Cascade`)                                                    |
| `readyMadeItemId`    | String?       | **FK** — set for a ready-made line, else null (`onDelete: SetNull`); XOR `productId`          |
| `productId`          | String?       | **FK** — set for a made-to-order line, else null (`onDelete: SetNull`); XOR `readyMadeItemId` |
| `nameSnapshot`       | String        | catalog name at purchase time                                                                 |
| `priceCentsSnapshot` | Int           | price actually charged for this line                                                          |
| `quantity`           | Int           | defaults to 1                                                                                 |
| `configuration`      | Json?         | **made-to-order only** — the immutable configurator snapshot (see decisions)                  |

### Reservation — a temporary meterage hold

**Made-to-order only.** Ready-made items are first-come (a boolean `available`), never
reserved. Reserve at add-to-cart (`ACTIVE`, with expiry) → deduct + `CONSUMED` on payment →
`RELEASED` on expiry or a **pre-production** cancellation (only that path restocks).

| Field                     | Type              | Notes                                                                 |
| ------------------------- | ----------------- | --------------------------------------------------------------------- |
| `id`                      | String (cuid)     |                                                                       |
| `createdAt` / `updatedAt` | DateTime          |                                                                       |
| `materialId`              | String            | **FK** → Material (`onDelete: Restrict` — materials are soft-deleted) |
| `quantity`                | Decimal(10,2)     | meterage held, in the material's `unit`                               |
| `expiresAt`               | DateTime          | `ACTIVE` past this = effectively released; a cleanup sweep flips it   |
| `status`                  | ReservationStatus | `ACTIVE / CONSUMED / RELEASED`                                        |
| `cartToken`               | String            | groups a (possibly **guest**) cart's holds before any order exists    |
| `orderId`                 | String?           | set on payment — links the hold to the order it fulfilled (`SetNull`) |

### Relationships in this slice

| Relationship              | Cardinality   | Why                                                                              |
| ------------------------- | ------------- | -------------------------------------------------------------------------------- |
| User → Order              | **1:N** (opt) | a customer has many orders; an order has 0-or-1 user (guest = null `userId`)     |
| Order → OrderItem         | **1:N**       | one order, many lines (`onDelete: Cascade` — deleting an order clears its lines) |
| OrderItem → Product       | **1:N** (opt) | a made-to-order line references its product; `SetNull` keeps history on delete   |
| OrderItem → ReadyMadeItem | **1:N** (opt) | a ready-made line references its item; `SetNull` keeps history on delete         |
| Order → Reservation       | **1:N** (opt) | the holds an order consumed; `null` while still in a cart                        |
| Reservation → Material    | **1:N**       | each hold is against one material; `Restrict` (materials are soft-deleted)       |
| User ⇄ Product            | **M:N**       | favourites; implicit `_ProductToUser` join; powers "Most loved"                  |

### Key design decisions (commerce)

- **Order created on payment, not at cart.** The cart is just a set of `ACTIVE`
  reservations keyed by `cartToken`; the `Order` row appears when Stripe confirms payment
  (webhook = source of truth). So there's no "pending cart order" cluttering the table.
- **Guest checkout, and guest orders are claimable.** `Order.email` is stored on every
  order and `userId` is nullable. When someone later makes an account with that email, we
  backfill `userId` on their orphan orders — **only after the email is verified** (Phase 6),
  or anyone could claim another person's history. Costs **zero** extra schema.
- **Made-to-order line = JSON snapshot, not live FKs.** `OrderItem.configuration` copies in
  the outline SVG + per-slot material choices (ids, snapshot names, hex/swatch, meterage).
  An order must re-render **identically forever**, even if those Slot/Material rows are later
  edited or deleted — so it can't point at live rows. Structured, queryable material usage
  lives on `Reservation` instead — at the **order** level (per-_line_ attribution waits for
  the deferred `orderItemId`, below).
- **Exactly one buying path per `OrderItem`** (`readyMadeItemId` XOR `productId`), enforced
  by a hand-written `CHECK` constraint since Prisma can't express it. A ready-made line
  reaches its product _through_ `readyMadeItem` — we don't duplicate `productId` onto it
  (no drift-prone copy). So `Product.orderItems` holds only made-to-order lines; ready-made
  lines live on `ReadyMadeItem.orderItems`.
- **Restock is conditional, never automatic.** PLAN §2/§9 says "refunds/cancellations
  restock" — that's a **simplification**. Meterage can only go back to stock if the fabric
  was never cut. `Order.productionStartedAt` is the gate: `null` = not cut → cancellable and
  restockable; once set, the meterage is physically spent and a later cancel/return does
  **not** restock. A returned _finished_ item isn't meterage at all — if resellable it's
  relisted as a new `ReadyMadeItem` (admin flow, Phase 8).
- **Reservations link order-level (`orderId`), not per-line.** Whole-order refunds are the
  only case until Phase 8; per-line refunds (add `orderItemId` + a `cartLineId` cart grouping)
  are an **additive** upgrade with nothing to backfill.
- **Grace period / refund policy live in code + T&C, not the DB.** The database stores
  _facts_ (`createdAt`, `productionStartedAt`, `status`); the policy knobs (grace window,
  partial-refund formula) are config, because they change and must mirror the T&C copy.
- **No auth columns on `User` yet.** Provider is a Phase 6 decision; adding hashed-password
  or provider-id columns then is additive.

---

## Relationships in this slice

| Relationship                  | Cardinality   | Why                                                                                                                                    |
| ----------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Category ⇄ Product            | **M:N**       | a product can sit in several categories (a knitted bag = Bags _and_ Knitwear); Prisma auto-creates the `_CategoryToProduct` join table |
| Product → ReadyMadeItem       | **1:N**       | one listing has many one-off items; each item belongs to one product (foreign key `productId` on the item)                             |
| ReadyMadeItem → Material      | **none**      | intentionally not linked — material info is display **text** (see decisions)                                                           |
| Product ⇄ CustomizationConfig | **1:1** (opt) | a customizable product has one config; `productId @unique` on the config enforces it (`#28`)                                           |
| CustomizationConfig → Slot    | **1:N**       | one config, many fillable areas (`#28`)                                                                                                |
| Slot → Region                 | **1:N**       | one slot, many SVG paths; filling the slot fills all of them (`#28`)                                                                   |
| Slot ⇄ Material               | **M:N**       | a slot's allowed palette; implicit `_MaterialToSlot` join (`#28`)                                                                      |

---

## Key design decisions (with rationale)

- **Ready-made material = text, not a relation.** A ready-made item is _already made_;
  its fabric was consumed at creation, so the listing never checks material stock — the
  info is descriptive, like a clothing store's "100% linen" line. A structured link
  would earn its keep only if we queried/decremented on it, which ready-made never does.
- **Ready-made stock = first-come, no cart hold.** Reservations hold fabric **meterage**
  for _made-to-order_ items only (a shared, finite resource). A ready-made item is a
  single object — it's simply `available` true/false. If two shoppers race, the first to
  **complete checkout** wins; the other gets an out-of-stock notice at a checkout re-check
  (#29). So `ReadyMadeItem` has **no `RESERVED` state** — a boolean, not an enum.
- **Category = table + M:N (not enum).** Admin needs to add/edit/delete categories, and
  a product can carry several tags at once.
- **Catalog grid = one card per available `ReadyMadeItem`** (H&M/Zalando-style). 5 tote
  versions = 5 cards, all sharing `product.name` (duplicate names are fine — that's how a
  store shows one style in 15 colours). Each card differs only by the _item's_ `images` +
  `description`; name / price / `customizable` tag are read from the parent through the
  relation. Query is a one-liner:
  `readyMadeItem.findMany({ where: { available: true }, include: { product: true } })` —
  no per-product fallback.
  - **Customizable products with _zero_ ready-made items are NOT shown as cards.** The
    catalog page instead carries a **CTA element** ("more made-to-order items on the
    Customize page →") linking to `/customize` (Phase 3 / #28). A non-customizable product
    with zero items is simply sold-out/hidden.
  - Purely a query/render choice — schema is unchanged.
- **`Material` defined standalone now.** Model a relationship only when a consumer needs
  it; the configurator (#28) is Material's first consumer, so its relations wait for it.
- **Soft-delete materials (planned).** Discontinue = mark out-of-stock, don't hard-delete,
  so any historical references stay valid.
- **Money as integer cents; images as `String[]`.** Avoids float rounding; simplest thing
  that feeds a carousel (a `ProductImage` model only if per-image alt/caption/order is needed).

---

## Deferred / don't-forget 📌

Not built now — noted so the shape is ready and we don't lose the idea. All are
**additive** (new table/field + migration, no restructuring), so cheap to add later —
especially while the catalog is seed-data only (nothing to backfill).

| Idea                                                            | What it needs                                                                                                                                                                                                                                                     | Why deferred                                                                                       |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **Filter by fabric _type_** (linen, cotton, wool — broad fibre) | a new `FabricType` tag table, **M:N** to Product (same pattern as Category). _Not_ derived from the `Material` entity — it's a coarse bucket, its own axis                                                                                                        | not in the mockup's filter list; no consumer yet                                                   |
| **Filter by fabric _colour_** (the swatch filter in the mockup) | a **structured `Colour` tag on `ReadyMadeItem`** (each item has its colour(s)). The product grid filters parents _through_ the nesting via `readyMadeItems: { some: { colours: { some: … } } }`. **Double duty:** same data powers the **card swatch dots** below | Phase 2 filtering feature; deferred, but the shape is now known (lives on the item, not free text) |
| **"Most loved" sort**                                           | ~~a favourites count from a `User ⇄ Product` (M:N) relation~~ — the relation **now exists** (#29, `User.favourites`); only the sort query/UI remains, in Phase 2                                                                                                  | relation delivered; sort deferred to the Phase 2 filtering/sort feature                            |

### Catalog card interaction (planned, front-end only)

Discoverability is inherently handled now — every ready-made item is already its own card.
Swatch dots become an _optional nicety_ on top:

- **Swatch dots on a card** = the sibling items of the same product; each dot's colour
  comes from the deferred `Colour` tag above.
- **Clicking a swatch swaps the card's image inline** (no navigation) to that sibling's
  photo — pure React state, using each item's existing `images`. No schema impact.

> Reminder: the mockup's filter sidebar is **Category · Availability · Fabric colour ·
> Price**, and the sort dropdown includes **Newest · Price · Most loved**. Category,
> Availability (`customizable` + "has ready-made items"), Price, and Newest are covered
> by this slice; Fabric colour and Most loved are deferred above.
