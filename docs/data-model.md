# Data model (ERD) — Nanalu Boutique

The database sketch for **Phase 1**. We build it **incrementally by domain slice**:

1. **Catalog** — `#27` (this slice) — the read-side data the shop renders.
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
    multi-tag)       listing)           in-stock pieces)

                     Material   ← defined standalone now; its relations
                     (fabric OR   arrive with the configurator (#28)
                      colour)

                          CUSTOMIZATION  (#28 — built now)
   Product ||──o| CustomizationConfig ||──< Slot ||──< Region
                                          Slot >──< Material  (allowed palette;
                                          meterage lives on the Slot itself)

                          COMMERCE  (#29 — later, sketch only)
   User ||──< Order ||──< OrderItem  ──> Product / ReadyMadeItem
   Reservation  (temporary meterage hold, has expiry)  ──> Material   (made-to-order ONLY)
   User >──< Product   (favourites — powers the "Most loved" sort)
```

The commerce relationships are still **sketches** — exact fields get designed in #29.

---

## Catalog slice (#27) — detail

### Product — the shared listing

One row per thing sold (e.g. "Linen Tote Bag"). Umbrella for **both** buying paths:
a product can have ready-made pieces in stock **and** offer customization.

| Field            | Type            | Notes                                                            |
| ---------------- | --------------- | ---------------------------------------------------------------- |
| `id`             | String (cuid)   | primary key; random, not sequential (doesn't leak catalog size)  |
| `createdAt`      | DateTime        | set once — powers the **"Newest"** sort                          |
| `updatedAt`      | DateTime        | auto-bumped on edit (bookkeeping)                                |
| `name`           | String          |                                                                  |
| `slug`           | String @unique  | URL handle (`/shop/linen-tote`)                                  |
| `description`    | String          | the **shared/general** blurb (true of every piece)               |
| `priceCents`     | Int             | money as **integer cents** (no float bugs; Stripe-ready)         |
| `images`         | String[]        | Cloudinary ids; feeds the carousel                               |
| `customizable`   | Boolean         | offers the configurator? drives the _Customize_ button + filter  |
| `active`         | Boolean         | soft-delete: `false` = discontinued (consistent with `Material`) |
| `categories`     | Category[]      | **M:N** — see below                                              |
| `readyMadeItems` | ReadyMadeItem[] | **1:N** — see below                                              |

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

### ReadyMadeItem — a unique in-stock piece

A single one-of-a-kind finished object under a Product (**qty always 1** — so no quantity
field; a piece is simply available or gone).

| Field                     | Type              | Notes                                                                      |
| ------------------------- | ----------------- | -------------------------------------------------------------------------- |
| `id`                      | String (cuid)     |                                                                            |
| `createdAt` / `updatedAt` | DateTime          |                                                                            |
| `productId`               | String            | **FK column** — the 1:N link back to Product                               |
| `product`                 | Product @relation | doorway to parent (`fields: [productId]`, `onDelete: Cascade`)             |
| `images`                  | String[]          | this piece's own gallery (quick-view + the card swatch image)              |
| `description`             | String            | **this piece's** blurb: fabric + any one-off quirks (material-as-**text**) |
| `priceCents`              | Int?              | **optional override**; falls back to `product.priceCents`                  |
| `available`               | Boolean           | `true` = for sale · `false` = sold (first-come; re-checked at checkout)    |

The broad description lives on `Product`; the item's `description` is what makes _this_
piece distinct. The UI shows both by reading `item.product.description` through the relation
(not duplicated onto the item).

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
piece ("the body panel needs ~0.5 m"), the same whichever allowed material you pick — like a
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

## Relationships in this slice

| Relationship                  | Cardinality   | Why                                                                                                                                    |
| ----------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Category ⇄ Product            | **M:N**       | a product can sit in several categories (a knitted bag = Bags _and_ Knitwear); Prisma auto-creates the `_CategoryToProduct` join table |
| Product → ReadyMadeItem       | **1:N**       | one listing has many one-off pieces; each piece belongs to one product (foreign key `productId` on the item)                           |
| ReadyMadeItem → Material      | **none**      | intentionally not linked — material info is display **text** (see decisions)                                                           |
| Product ⇄ CustomizationConfig | **1:1** (opt) | a customizable product has one config; `productId @unique` on the config enforces it (`#28`)                                           |
| CustomizationConfig → Slot    | **1:N**       | one config, many fillable areas (`#28`)                                                                                                |
| Slot → Region                 | **1:N**       | one slot, many SVG paths; filling the slot fills all of them (`#28`)                                                                   |
| Slot ⇄ Material               | **M:N**       | a slot's allowed palette; implicit `_MaterialToSlot` join (`#28`)                                                                      |

---

## Key design decisions (with rationale)

- **Ready-made material = text, not a relation.** A ready-made piece is _already made_;
  its fabric was consumed at creation, so the listing never checks material stock — the
  info is descriptive, like a clothing store's "100% linen" line. A structured link
  would earn its keep only if we queried/decremented on it, which ready-made never does.
- **Ready-made stock = first-come, no cart hold.** Reservations hold fabric **meterage**
  for _made-to-order_ items only (a shared, finite resource). A ready-made piece is a
  single object — it's simply `available` true/false. If two shoppers race, the first to
  **complete checkout** wins; the other gets an out-of-stock notice at a checkout re-check
  (#29). So `ReadyMadeItem` has **no `RESERVED` state** — a boolean, not an enum.
- **Category = table + M:N (not enum).** Admin needs to add/edit/delete categories, and
  a product can carry several tags at once.
- **Catalog grid = one card per available `ReadyMadeItem`** (H&M/Zalando-style). 5 tote
  versions = 5 cards, all sharing `product.name` (duplicate names are fine — that's how a
  store shows one style in 15 colours). Each card differs only by the _piece's_ `images` +
  `description`; name / price / `customizable` tag are read from the parent through the
  relation. Query is a one-liner:
  `readyMadeItem.findMany({ where: { available: true }, include: { product: true } })` —
  no per-product fallback.
  - **Customizable products with _zero_ ready-made pieces are NOT shown as cards.** The
    catalog page instead carries a **CTA element** ("more made-to-order pieces on the
    Customize page →") linking to `/customize` (Phase 3 / #28). A non-customizable product
    with zero pieces is simply sold-out/hidden.
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

| Idea                                                            | What it needs                                                                                                                                                                                                                                                      | Why deferred                                                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| **Filter by fabric _type_** (linen, cotton, wool — broad fibre) | a new `FabricType` tag table, **M:N** to Product (same pattern as Category). _Not_ derived from the `Material` entity — it's a coarse bucket, its own axis                                                                                                         | not in the mockup's filter list; no consumer yet                                                    |
| **Filter by fabric _colour_** (the swatch filter in the mockup) | a **structured `Colour` tag on `ReadyMadeItem`** (each piece has its colour(s)). The product grid filters parents _through_ the nesting via `readyMadeItems: { some: { colours: { some: … } } }`. **Double duty:** same data powers the **card swatch dots** below | Phase 2 filtering feature; deferred, but the shape is now known (lives on the piece, not free text) |
| **"Most loved" sort**                                           | a favourites count from a `User ⇄ Product` (M:N) relation                                                                                                                                                                                                          | needs accounts + favourites (commerce, #29)                                                         |

### Catalog card interaction (planned, front-end only)

Discoverability is inherently handled now — every ready-made piece is already its own card.
Swatch dots become an _optional nicety_ on top:

- **Swatch dots on a card** = the sibling pieces of the same product; each dot's colour
  comes from the deferred `Colour` tag above.
- **Clicking a swatch swaps the card's image inline** (no navigation) to that sibling's
  photo — pure React state, using each piece's existing `images`. No schema impact.

> Reminder: the mockup's filter sidebar is **Category · Availability · Fabric colour ·
> Price**, and the sort dropdown includes **Newest · Price · Most loved**. Category,
> Availability (`customizable` + "has ready-made items"), Price, and Newest are covered
> by this slice; Fabric colour and Most loved are deferred above.
