import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Harness smoke test: proves the whole component path works together —
// @vitejs/plugin-react transforms the JSX, jsdom provides the DOM, React
// Testing Library renders + queries it, and the jest-dom matcher asserts on it.
// Safe to delete once real component tests exist (deferred; see CLAUDE.md).
describe("rendering harness", () => {
  it("renders a component into jsdom", () => {
    render(<p>hello</p>);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
