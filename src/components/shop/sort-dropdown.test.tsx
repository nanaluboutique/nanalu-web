import { useRouter, useSearchParams } from "next/navigation";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SortDropdown } from "./sort-dropdown";

// Same next/navigation stub as the other client controls: the dropdown reads ?sort from
// useSearchParams and writes the next one via useFilterParams → useRouter().push.
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

const push = vi.fn();

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

describe("SortDropdown", () => {
  it("shows the URL's sort as the selected option", () => {
    mockUrl("sort=price-asc");
    render(<SortDropdown />);

    // getByLabelText also proves the sr-only <label htmlFor="shop-sort"> is wired to the
    // <select> — the accessible name a screen reader announces.
    expect(screen.getByLabelText("Sort by")).toHaveValue("price-asc");
  });

  it("falls back to Newest (the default) when the URL has no sort", () => {
    mockUrl("");
    render(<SortDropdown />);

    expect(screen.getByLabelText("Sort by")).toHaveValue("newest");
  });

  it("writes ?sort when a non-default option is picked", () => {
    mockUrl("");
    render(<SortDropdown />);

    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "price-desc" } });

    expect(push).toHaveBeenCalledWith("/shop?sort=price-desc", { scroll: false });
  });

  it("removes the param when Newest (the default) is re-selected", () => {
    // Picking the default writes no ?sort=newest — it drops the param so a default view keeps
    // a clean, query-free URL.
    mockUrl("sort=price-asc");
    render(<SortDropdown />);

    fireEvent.change(screen.getByLabelText("Sort by"), { target: { value: "newest" } });

    expect(push).toHaveBeenCalledWith("/shop", { scroll: false });
  });
});
