import { describe, expect, it } from "vitest";

import { formatEuros } from "@/lib/money";

describe("formatEuros", () => {
  it("formats whole euros with two decimal places", () => {
    expect(formatEuros(4800)).toBe("€48.00");
  });

  it("pads a single-digit cents remainder to two places", () => {
    // 4805 → €48.05, not €48.5 — the padStart is what this locks in.
    expect(formatEuros(4805)).toBe("€48.05");
  });

  it("keeps a two-digit cents remainder as-is", () => {
    expect(formatEuros(4850)).toBe("€48.50");
  });

  it("formats zero", () => {
    expect(formatEuros(0)).toBe("€0.00");
  });

  it("formats an amount under one euro", () => {
    expect(formatEuros(99)).toBe("€0.99");
  });

  it("does not introduce float artifacts for awkward values", () => {
    // 1990 / 100 is 19.9 exactly here, but values like this are where a naive
    // toFixed pipeline tends to wobble — pin the integer-math result.
    expect(formatEuros(1990)).toBe("€19.90");
    expect(formatEuros(2210)).toBe("€22.10");
  });

  it("formats a negative amount (a future refund line) sensibly", () => {
    // Math.abs on the remainder keeps the minus on the euros only.
    expect(formatEuros(-4805)).toBe("€-48.05");
  });
});
