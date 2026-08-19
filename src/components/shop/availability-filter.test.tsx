import { useRouter, useSearchParams } from "next/navigation";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AvailabilityFilter } from "./availability-filter";

// Same next/navigation mock as use-filter-params.test.ts: AvailabilityFilter calls the real
// useFilterParams hook, which reads useSearchParams() and pushes via useRouter(). We stub
// both so the test controls the URL and watches where a toggle navigates. We deliberately do
// NOT mock useFilterParams itself — letting the real hook run tests the component and the
// hook together, the way they ship.
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}));

const push = vi.fn();

// Pretend the URL is `query`, and watch navigations via push.
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

describe("AvailabilityFilter", () => {
  it("checks both boxes when the URL carries no availability params (the default view)", () => {
    mockUrl("");
    render(<AvailabilityFilter />);

    expect(screen.getByRole("checkbox", { name: "Ready to ship" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Customizable" })).toBeChecked();
  });

  it("unchecks only the box its =0 marker names", () => {
    // ?ready=0 means the shopper turned "Ready to ship" off; "Customizable" is still on.
    mockUrl("ready=0");
    render(<AvailabilityFilter />);

    expect(screen.getByRole("checkbox", { name: "Ready to ship" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Customizable" })).toBeChecked();
  });

  it("writes ready=0 when 'Ready to ship' is unchecked", () => {
    mockUrl("");
    render(<AvailabilityFilter />);

    // The box starts checked; clicking toggles it off, so onChange sees checked=false and
    // writes the "0" off-marker.
    fireEvent.click(screen.getByRole("checkbox", { name: "Ready to ship" }));

    expect(push).toHaveBeenCalledWith("/shop?ready=0", { scroll: false });
  });

  it("writes custom=0 when 'Customizable' is unchecked", () => {
    mockUrl("");
    render(<AvailabilityFilter />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Customizable" }));

    expect(push).toHaveBeenCalledWith("/shop?custom=0", { scroll: false });
  });

  it("removes the param when an off box is re-checked", () => {
    // Start from ?ready=0 (box off). Clicking re-checks it, so onChange sees checked=true,
    // passes null, and the param is dropped — back to a clean /shop.
    mockUrl("ready=0");
    render(<AvailabilityFilter />);

    fireEvent.click(screen.getByRole("checkbox", { name: "Ready to ship" }));

    expect(push).toHaveBeenCalledWith("/shop", { scroll: false });
  });
});
