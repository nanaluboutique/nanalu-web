import { useRouter, useSearchParams } from "next/navigation";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PriceFilter } from "./price-filter";

// Same next/navigation stub as the other client controls. PriceFilter reads the cap out of
// the URL (useSearchParams) and commits a new cap via useFilterParams → useRouter().push.
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

describe("PriceFilter", () => {
  it("sets the thumb to the URL's cap in euros", () => {
    // ?maxPrice=30 (euros in the URL) → the thumb sits at 30 on a 0..100 track.
    mockUrl("maxPrice=30");
    render(<PriceFilter ceilingEuros={100} />);

    expect(screen.getByRole("slider")).toHaveValue("30");
  });

  it("moves the thumb while dragging without navigating", () => {
    mockUrl("");
    render(<PriceFilter ceilingEuros={100} />);
    const slider = screen.getByRole("slider");

    // A range input fires `change` continuously as you drag. Each one only updates the local
    // value — the thumb follows, but the URL must not change until release.
    fireEvent.change(slider, { target: { value: "30" } });

    expect(slider).toHaveValue("30");
    expect(push).not.toHaveBeenCalled();
  });

  it("commits the cap to the URL on pointer release", () => {
    mockUrl("");
    render(<PriceFilter ceilingEuros={100} />);
    const slider = screen.getByRole("slider");

    fireEvent.change(slider, { target: { value: "30" } });
    fireEvent.pointerUp(slider);

    expect(push).toHaveBeenCalledWith("/shop?maxPrice=30", { scroll: false });
  });

  it("commits on keyboard release too (onKeyUp)", () => {
    // Keyboard users move the thumb with arrow keys; the commit hangs off keyUp, not just
    // pointerUp, so their final position writes to the URL the same way.
    mockUrl("");
    render(<PriceFilter ceilingEuros={100} />);
    const slider = screen.getByRole("slider");

    fireEvent.change(slider, { target: { value: "45" } });
    fireEvent.keyUp(slider);

    expect(push).toHaveBeenCalledWith("/shop?maxPrice=45", { scroll: false });
  });

  it("drops the param when released at the ceiling (no cap)", () => {
    // Start with a cap, then drag all the way up: the ceiling means "no limit", so committing
    // there removes maxPrice rather than writing maxPrice=100 — keeping a default view clean.
    mockUrl("maxPrice=30");
    render(<PriceFilter ceilingEuros={100} />);
    const slider = screen.getByRole("slider");

    fireEvent.change(slider, { target: { value: "100" } });
    fireEvent.pointerUp(slider);

    expect(push).toHaveBeenCalledWith("/shop", { scroll: false });
  });

  it("resyncs the thumb when the URL changes from outside the slider", () => {
    mockUrl("maxPrice=30");
    const { rerender } = render(<PriceFilter ceilingEuros={100} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveValue("30");

    // Drag locally to 50 without releasing. A re-render must NOT clobber this back to 30,
    // because the URL (still 30) hasn't changed — the local drag wins.
    fireEvent.change(slider, { target: { value: "50" } });
    rerender(<PriceFilter ceilingEuros={100} />);
    expect(slider).toHaveValue("50");

    // Now the URL changes from OUTSIDE the slider (e.g. the price chip's ×): the cap is gone.
    // On the next render the URL's implied value (the ceiling) differs from what the slider
    // last recorded, so the render-time resync snaps the thumb to the ceiling — "no limit" —
    // discarding the stale local 50.
    mockUrl("");
    rerender(<PriceFilter ceilingEuros={100} />);
    expect(slider).toHaveValue("100");
    expect(slider).toHaveAccessibleName("Maximum price: no limit");
  });
});
