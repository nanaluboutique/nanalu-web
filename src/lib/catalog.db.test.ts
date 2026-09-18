// DB-integration tests for the catalog read layer (#60).
//
// UNLIKE catalog.test.ts (which mocks @/lib/db away to test the PURE helpers), these
// run the REAL queries against a REAL throwaway Postgres — because the behaviour worth
// asserting lives inside the Prisma `where`/`orderBy`, and only a real database proves
// a filter excludes the right rows or a tiebreaker actually settles ties. They run
// under vitest.db.config.ts (`npm run test:db`), never under the default `npm test`.
//
// vitest.db.setup.ts wipes every table before EACH test, so each one starts from an
// empty database and inserts only the rows it cares about — the fixture and the
// assertion sit side by side, and no test can be polluted by another.

import { describe, expect, it } from "vitest";

import type { Prisma } from "@/generated/prisma/client";
import { getProductBySlug, hasCustomizableWithoutStock, listAvailableItems } from "@/lib/catalog";
import { getPrisma } from "@/lib/db";

const prisma = getPrisma();

// A single timestamp reused wherever a test needs two rows to TIE on createdAt (the
// real-world case: a product's items are written by one nested create, so they share
// a createdAt to the millisecond — which is exactly when the id tiebreaker matters).
const TIE = new Date("2026-01-01T00:00:00.000Z");

// ── Fixture builders ──────────────────────────────────────────────────────────
// Fill in every REQUIRED column with a sane default (name/slug/description/priceCents
// on Product; description on ReadyMadeItem) so a test only has to state the field it's
// actually about. Tables are wiped between tests, so fixed slugs never collide.

type ItemInput = Partial<Prisma.ReadyMadeItemCreateWithoutProductInput>;

function createProduct(
  overrides: Partial<Prisma.ProductCreateInput> = {},
  items: ItemInput[] = [],
) {
  return prisma.product.create({
    data: {
      name: "Linen Tote Bag",
      slug: "linen-tote-bag",
      description: "A roomy everyday tote.",
      priceCents: 4800,
      ...overrides,
      readyMadeItems: {
        create: items.map((item) => ({ description: "A linen tote", ...item })),
      },
    },
    include: { readyMadeItems: true },
  });
}

describe("listAvailableItems", () => {
  it("returns available items whose product is active", async () => {
    await createProduct({}, [{ available: true }]);

    const items = await listAvailableItems();

    expect(items).toHaveLength(1);
  });

  it("excludes a sold (unavailable) item", async () => {
    await createProduct({}, [
      { description: "unsold", available: true },
      { description: "sold", available: false },
    ]);

    const items = await listAvailableItems();

    expect(items).toHaveLength(1);
    expect(items[0]?.description).toBe("unsold");
  });

  it("excludes an available item whose product is inactive (discontinued)", async () => {
    // The exact leak the query's TWO conditions guard against: an unsold item must
    // not reappear in the grid just because its parent product is only soft-deleted.
    await createProduct({ active: false }, [{ available: true }]);

    const items = await listAvailableItems();

    expect(items).toHaveLength(0);
  });

  it("orders items newest-first by createdAt", async () => {
    await createProduct({ slug: "older-product" }, [
      { description: "older", createdAt: new Date("2026-01-01T00:00:00.000Z") },
    ]);
    await createProduct({ slug: "newer-product" }, [
      { description: "newer", createdAt: new Date("2026-02-01T00:00:00.000Z") },
    ]);

    const items = await listAvailableItems();

    expect(items.map((i) => i.description)).toEqual(["newer", "older"]);
  });

  it("breaks createdAt ties by id descending, deterministically", async () => {
    // Two items with an IDENTICAL createdAt and explicit ids. Without the `id` half
    // of the orderBy, Postgres could return these in either order (and reshuffle
    // between calls); with it, "id desc" fixes them as b-before-a, every time.
    await createProduct({}, [
      { id: "item_a", description: "a", createdAt: TIE },
      { id: "item_b", description: "b", createdAt: TIE },
    ]);

    const first = await listAvailableItems();
    const second = await listAvailableItems();

    expect(first.map((i) => i.id)).toEqual(["item_b", "item_a"]);
    // Same order on a second call — the property the tiebreaker exists to give.
    expect(second.map((i) => i.id)).toEqual(["item_b", "item_a"]);
  });

  it("includes each item's product, its categories, and its colours", async () => {
    await createProduct(
      {
        categories: { create: { name: "Pouches", slug: "pouches" } },
      },
      [
        {
          available: true,
          colours: { create: { name: "Sage", slug: "sage", hex: "#B6C7A1" } },
        },
      ],
    );

    const items = await listAvailableItems();

    expect(items[0]?.product.name).toBe("Linen Tote Bag");
    expect(items[0]?.product.categories.map((c) => c.slug)).toEqual(["pouches"]);
    expect(items[0]?.colours.map((c) => c.slug)).toEqual(["sage"]);
  });
});

describe("getProductBySlug", () => {
  it("returns the product for an active slug, INCLUDING its sold items", async () => {
    await createProduct({ slug: "tote" }, [
      { description: "unsold", available: true },
      { description: "sold", available: false },
    ]);

    const product = await getProductBySlug("tote");

    expect(product).not.toBeNull();
    // Sold items come back too — hiding them is a rendering decision, not this query's.
    expect(product?.readyMadeItems).toHaveLength(2);
  });

  it("returns null for a missing slug", async () => {
    const product = await getProductBySlug("does-not-exist");

    expect(product).toBeNull();
  });

  it("returns null for an inactive (discontinued) product's slug", async () => {
    await createProduct({ slug: "retired", active: false }, [{ available: true }]);

    const product = await getProductBySlug("retired");

    expect(product).toBeNull();
  });
});

describe("hasCustomizableWithoutStock", () => {
  it("is true when a customizable, active product has no available item", async () => {
    // Customizable but its only item is sold → no card in the grid, yet still
    // made-to-order, so the shop must show the "design your own" CTA.
    await createProduct({ customizable: true }, [{ available: false }]);

    expect(await hasCustomizableWithoutStock()).toBe(true);
  });

  it("is false when the customizable product still has an available item", async () => {
    await createProduct({ customizable: true }, [{ available: true }]);

    expect(await hasCustomizableWithoutStock()).toBe(false);
  });

  it("is false when the stockless product is not customizable", async () => {
    await createProduct({ customizable: false }, []);

    expect(await hasCustomizableWithoutStock()).toBe(false);
  });

  it("is false when the stockless customizable product is inactive", async () => {
    await createProduct({ customizable: true, active: false }, []);

    expect(await hasCustomizableWithoutStock()).toBe(false);
  });
});
