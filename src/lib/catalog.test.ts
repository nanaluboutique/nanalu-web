import { describe, expect, it, vi } from "vitest";

import type { Product, ReadyMadeItem } from "@/generated/prisma/client";
import { priceCentsFor } from "@/lib/catalog";

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
function makePiece(overrides: Partial<ReadyMadeItem> = {}): ReadyMadeItem {
  return {
    id: "piece_1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    productId: "prod_1",
    images: [],
    description: "A linen tote in navy",
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
    priceCents: 4800,
    images: [],
    customizable: false,
    active: true,
    ...overrides,
  };
}

describe("priceCentsFor", () => {
  it("uses the piece's own price when the override is set", () => {
    const piece = makePiece({ priceCents: 5200 });
    const product = makeProduct({ priceCents: 4800 });
    expect(priceCentsFor(piece, product)).toBe(5200);
  });

  it("falls back to the product price when the override is null", () => {
    const piece = makePiece({ priceCents: null });
    const product = makeProduct({ priceCents: 4800 });
    expect(priceCentsFor(piece, product)).toBe(4800);
  });

  it("treats a zero override as a real price, not a missing one", () => {
    // `??` only falls back on null/undefined, so an explicit 0 stays 0 — a `||`
    // here would wrongly return the product price. This locks that distinction.
    const piece = makePiece({ priceCents: 0 });
    const product = makeProduct({ priceCents: 4800 });
    expect(priceCentsFor(piece, product)).toBe(0);
  });
});
