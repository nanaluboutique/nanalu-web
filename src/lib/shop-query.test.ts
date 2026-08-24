import { describe, expect, it } from "vitest";

import { DEFAULT_SORT, parseShopQuery, removeParams, updateParam } from "@/lib/shop-query";

// Small helper: parseShopQuery takes a URLSearchParams, so build one from a query string.
const parse = (query: string) => parseShopQuery(new URLSearchParams(query));

describe("parseShopQuery", () => {
  it("applies every default for an empty query", () => {
    expect(parse("")).toEqual({
      category: null,
      colour: null,
      ready: true,
      customizable: true,
      maxPriceCents: null,
      sort: DEFAULT_SORT,
    });
  });

  it("reads a category slug, and treats an empty one as no filter", () => {
    expect(parse("category=pouches").category).toBe("pouches");
    expect(parse("category=").category).toBeNull();
  });

  it("reads a colour slug, and treats an empty one as no filter", () => {
    expect(parse("colour=sage").colour).toBe("sage");
    expect(parse("colour=").colour).toBeNull();
  });

  it("checkboxes default ON, and only `=0` turns them off", () => {
    // The URL carries a checkbox ONLY when it's off (ready=0 / custom=0); anything
    // else — absent, or any other value — means checked.
    expect(parse("").ready).toBe(true);
    expect(parse("ready=0").ready).toBe(false);
    expect(parse("ready=1").ready).toBe(true); // not the off-marker → still checked
    expect(parse("custom=0").customizable).toBe(false);
    expect(parse("ready=0&custom=0")).toMatchObject({ ready: false, customizable: false });
  });

  it("converts a valid maxPrice (euros) to integer cents", () => {
    expect(parse("maxPrice=30").maxPriceCents).toBe(3000);
  });

  it("treats a missing, zero, negative, or non-numeric maxPrice as no cap (null)", () => {
    expect(parse("").maxPriceCents).toBeNull();
    expect(parse("maxPrice=0").maxPriceCents).toBeNull();
    expect(parse("maxPrice=-5").maxPriceCents).toBeNull();
    expect(parse("maxPrice=banana").maxPriceCents).toBeNull();
  });

  it("accepts a valid sort and falls back to the default for anything unknown", () => {
    expect(parse("sort=price-asc").sort).toBe("price-asc");
    expect(parse("sort=price-desc").sort).toBe("price-desc");
    expect(parse("sort=banana").sort).toBe(DEFAULT_SORT); // junk → default, never throws
  });
});

describe("updateParam", () => {
  it("sets a new key while leaving the others untouched", () => {
    const current = new URLSearchParams("sort=newest");
    expect(updateParam(current, "category", "pouches")).toBe("sort=newest&category=pouches");
  });

  it("overwrites an existing key rather than duplicating it", () => {
    const current = new URLSearchParams("category=pouches");
    expect(updateParam(current, "category", "knitwear")).toBe("category=knitwear");
  });

  it("removes the key when the value is null, keeping the rest", () => {
    const current = new URLSearchParams("category=pouches&sort=newest");
    expect(updateParam(current, "category", null)).toBe("sort=newest");
  });

  it("returns an empty string when the last param is removed", () => {
    expect(updateParam(new URLSearchParams("category=pouches"), "category", null)).toBe("");
  });

  it("does not mutate the params it is given", () => {
    // It clones internally, so the caller's live URL params must be untouched.
    const current = new URLSearchParams("category=pouches");
    updateParam(current, "category", "knitwear");
    expect(current.get("category")).toBe("pouches");
  });
});

describe("removeParams", () => {
  it("drops several keys at once, keeping everything else", () => {
    const current = new URLSearchParams("category=pouches&ready=0&maxPrice=30");
    // The availability chip clears both `ready` and `custom` in one click.
    expect(removeParams(current, ["ready", "custom"])).toBe("category=pouches&maxPrice=30");
  });

  it("ignores keys that aren't present", () => {
    const current = new URLSearchParams("category=pouches");
    expect(removeParams(current, ["ready", "custom"])).toBe("category=pouches");
  });

  it("returns an empty string when every key is removed", () => {
    expect(removeParams(new URLSearchParams("maxPrice=30"), ["maxPrice"])).toBe("");
  });

  it("does not mutate the params it is given", () => {
    const current = new URLSearchParams("category=pouches&ready=0");
    removeParams(current, ["ready"]);
    expect(current.get("ready")).toBe("0");
  });
});
