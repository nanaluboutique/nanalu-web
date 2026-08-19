import { useRouter, useSearchParams } from "next/navigation";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFilterParams } from "./use-filter-params";

// useFilterParams calls useRouter() and useSearchParams() from next/navigation. Neither
// exists outside a running Next app — jsdom has no router and no real URL — so we replace
// the whole module with two vi.fn() stubs. Each test then decides what the URL looks like
// (useSearchParams) and watches where we navigate (useRouter().push). The factory touches
// only `vi`, so there's no out-of-scope-variable hoisting problem.
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

// One spy standing in for router.push, shared across tests and cleared before each.
const push = vi.fn();

// Point the "current URL" at `query` (e.g. "sort=price-asc") and wire push in, so the hook
// under test reads exactly the URL this test is about.
function mockUrl(query: string) {
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams(query) as ReturnType<typeof useSearchParams>,
  );
  vi.mocked(useRouter).mockReturnValue({
    push,
  } as unknown as ReturnType<typeof useRouter>);
}

beforeEach(() => {
  push.mockClear();
});

describe("useFilterParams", () => {
  it("changes one param and navigates, keeping the others and the scroll position", () => {
    mockUrl("sort=price-asc");
    const { result } = renderHook(() => useFilterParams());

    // Turn the "Ready to ship" box off: the hook adds ready=0 while leaving the existing
    // sort untouched, and pushes there with scroll:false so the shopper keeps their place.
    result.current.setParam("ready", "0");

    expect(push).toHaveBeenCalledWith("/shop?sort=price-asc&ready=0", { scroll: false });
  });

  it("drops a param when the value is null, linking back to a clean /shop", () => {
    mockUrl("ready=0");
    const { result } = renderHook(() => useFilterParams());

    // Re-check the box: setParam(..., null) removes the only param, so the next URL is the
    // bare /shop with no query string (not a dangling "/shop?").
    result.current.setParam("ready", null);

    expect(push).toHaveBeenCalledWith("/shop", { scroll: false });
  });

  it("exposes the current URL params for a control to read its own value", () => {
    mockUrl("sort=price-asc&maxPrice=30");
    const { result } = renderHook(() => useFilterParams());

    // `current` is a plain, mutable URLSearchParams copy of the URL. (Note the doubled
    // `.current`: the outer one is React Testing Library's "latest hook return", the inner
    // one is our hook's own `current` field.)
    expect(result.current.current.get("sort")).toBe("price-asc");
    expect(result.current.current.get("maxPrice")).toBe("30");
  });
});
