import { describe, expect, it, vi } from "vitest";

import type { Category, Product, ReadyMadeItem } from "@/generated/prisma/client";
import { careFor, itemsToCards, priceCentsFor, type CatalogItem } from "@/lib/catalog";

// catalog.ts imports @/lib/db, which imports `server-only` — a module that THROWS
// the instant it loads outside a React Server Component (so a browser bundle can
// never pull the DB in). A unit test isn't an RSC, so importing the real db module
// would blow up on load. priceCentsFor is pure (it never queries), so we replace
// the whole db module with a stub. getPrisma throws if anything reaches for the
// DB — which keeps this test provably pure. (vi.mock is hoisted above the imports.)
vi.mock("@/lib/db", () => ({
  getPrisma: () => {
    throw new Error("getPrisma() must not be called from a pure unit test");
  },
}));

// Build complete, valid rows; each test overrides only the field it cares about.
// These are the Prisma-generated scalar shapes (relations excluded).
function makeItem(overrides: Partial<ReadyMadeItem> = {}): ReadyMadeItem {
  return {
    id: "item_1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    productId: "prod_1",
    images: [],
    description: "A linen tote in navy",
    care: null,
    priceCents: null,
    available: true,
    ...overrides,
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod_1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    name: "Linen tote",
    slug: "linen-tote",
    description: "A roomy handmade linen tote",
    care: null,
    dimensions: null,
    priceCents: 4800,
    images: [],
    customizable: false,
    active: true,
    ...overrides,
  };
}

describe("priceCentsFor", () => {
  it("uses the item's own price when the override is set", () => {
    const item = makeItem({ priceCents: 5200 });
    const product = makeProduct({ priceCents: 4800 });
    expect(priceCentsFor(item, product)).toBe(5200);
  });

  it("falls back to the product price when the override is null", () => {
    const item = makeItem({ priceCents: null });
    const product = makeProduct({ priceCents: 4800 });
    expect(priceCentsFor(item, product)).toBe(4800);
  });

  it("treats a zero override as a real price, not a missing one", () => {
    // `??` only falls back on null/undefined, so an explicit 0 stays 0 — a `||`
    // here would wrongly return the product price. This locks that distinction.
    const item = makeItem({ priceCents: 0 });
    const product = makeProduct({ priceCents: 4800 });
    expect(priceCentsFor(item, product)).toBe(0);
  });
});

describe("careFor", () => {
  it("uses the item's own care when the override is set", () => {
    const item = makeItem({ care: "Hand-wash cold, dry flat" });
    const product = makeProduct({ care: "Machine wash warm" });
    expect(careFor(item, product)).toBe("Hand-wash cold, dry flat");
  });

  it("falls back to the product's care when the item's override is null", () => {
    const item = makeItem({ care: null });
    const product = makeProduct({ care: "Machine wash warm" });
    expect(careFor(item, product)).toBe("Machine wash warm");
  });

  it("returns null when neither the item nor the product has care", () => {
    // Null is meaningful here: the product page hides the Care accordion section
    // rather than showing an empty one, so this case must stay null, not "".
    const item = makeItem({ care: null });
    const product = makeProduct({ care: null });
    expect(careFor(item, product)).toBeNull();
  });
});

// A CatalogItem is a ReadyMadeItem with its parent product (and the product's
// categories) nested in — the shape listAvailableItems() returns. We build it by
// composing the scalar helpers above with a product + categories.
function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cat_1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    name: "Bags & totes",
    slug: "bags-totes",
    ...overrides,
  };
}

function makeCatalogItem(
  item: Partial<ReadyMadeItem>,
  product: Partial<Product>,
  categories: Category[] = [],
): CatalogItem {
  return {
    ...makeItem(item),
    product: { ...makeProduct(product), categories },
  };
}

describe("itemsToCards", () => {
  it("emits one card per item", () => {
    const items = [
      makeCatalogItem({ id: "p1", productId: "prod_1" }, { id: "prod_1" }),
      makeCatalogItem({ id: "p2", productId: "prod_1" }, { id: "prod_1" }),
      makeCatalogItem({ id: "p3", productId: "prod_2" }, { id: "prod_2" }),
    ];
    const cards = itemsToCards(items);
    expect(cards.map((c) => c.defaultItemId)).toEqual(["p1", "p2", "p3"]);
  });

  it("preserves the input order (newest-first stays newest-first)", () => {
    const items = [
      makeCatalogItem({ id: "newest", productId: "prod_1" }, { id: "prod_1" }),
      makeCatalogItem({ id: "oldest", productId: "prod_1" }, { id: "prod_1" }),
    ];
    expect(itemsToCards(items).map((c) => c.defaultItemId)).toEqual(["newest", "oldest"]);
  });

  it("gives every sibling card the same full sibling list, in encounter order", () => {
    const items = [
      makeCatalogItem({ id: "a", productId: "prod_1" }, { id: "prod_1" }),
      makeCatalogItem({ id: "b", productId: "prod_1" }, { id: "prod_1" }),
      makeCatalogItem({ id: "c", productId: "prod_1" }, { id: "prod_1" }),
    ];
    const cards = itemsToCards(items);
    const ids = ["a", "b", "c"];
    for (const card of cards) {
      expect(card.itemSiblings.map((s) => s.itemId)).toEqual(ids);
    }
  });

  it("does not mix siblings across products", () => {
    const items = [
      makeCatalogItem({ id: "a", productId: "prod_1" }, { id: "prod_1" }),
      makeCatalogItem({ id: "x", productId: "prod_2" }, { id: "prod_2" }),
      makeCatalogItem({ id: "b", productId: "prod_1" }, { id: "prod_1" }),
    ];
    const [cardA] = itemsToCards(items);
    expect(cardA.itemSiblings.map((s) => s.itemId)).toEqual(["a", "b"]);
  });

  it("resolves each sibling's price via the override-then-product fallback", () => {
    const items = [
      // item override wins
      makeCatalogItem({ id: "a", productId: "prod_1", priceCents: 5200 }, { id: "prod_1" }),
      // null override → falls back to the product's price
      makeCatalogItem(
        { id: "b", productId: "prod_1", priceCents: null },
        { id: "prod_1", priceCents: 4800 },
      ),
    ];
    const [card] = itemsToCards(items);
    expect(card.itemSiblings).toEqual([
      { itemId: "a", imageKey: "", priceCents: 5200 },
      { itemId: "b", imageKey: "", priceCents: 4800 },
    ]);
  });

  it("uses the item's first image as the card image, or '' when it has none", () => {
    const items = [
      makeCatalogItem(
        { id: "a", productId: "prod_1", images: ["products/tote/natural", "products/tote/detail"] },
        { id: "prod_1" },
      ),
      makeCatalogItem({ id: "b", productId: "prod_1", images: [] }, { id: "prod_1" }),
    ];
    const [card] = itemsToCards(items);
    expect(card.itemSiblings.map((s) => s.imageKey)).toEqual(["products/tote/natural", ""]);
  });

  it("reads name, slug and customizable from the parent product", () => {
    const items = [
      makeCatalogItem(
        { id: "a", productId: "prod_1" },
        { id: "prod_1", name: "Linen Tote Bag", slug: "linen-tote-bag", customizable: true },
      ),
    ];
    const [card] = itemsToCards(items);
    expect(card).toMatchObject({
      productName: "Linen Tote Bag",
      productSlug: "linen-tote-bag",
      customizable: true,
    });
  });

  it("takes the first category name, or null when the product has none", () => {
    const withCat = makeCatalogItem({ id: "a", productId: "prod_1" }, { id: "prod_1" }, [
      makeCategory({ name: "Bags & totes" }),
      makeCategory({ id: "cat_2", name: "Knitwear" }),
    ]);
    const withoutCat = makeCatalogItem({ id: "b", productId: "prod_2" }, { id: "prod_2" }, []);
    const [cardA, cardB] = itemsToCards([withCat, withoutCat]);
    expect(cardA.category).toBe("Bags & totes");
    expect(cardB.category).toBeNull();
  });

  it("returns an empty array for no items", () => {
    expect(itemsToCards([])).toEqual([]);
  });
});
