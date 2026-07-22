import { describe, expect, it } from "vitest";

// Harness smoke test: proves the Vitest runner and assertions work at all.
// Safe to delete once real unit tests exist (the #53 backfill).
describe("test harness", () => {
  it("runs and evaluates assertions", () => {
    expect(1 + 1).toBe(2);
  });
});
