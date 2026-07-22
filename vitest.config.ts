import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Lets Vitest transform JSX/TSX, so component tests (React Testing Library)
  // work. Harmless for pure-function tests that render nothing.
  plugins: [react()],

  test: {
    // Give tests a browser-like DOM (document, window, ...) implemented in pure
    // JS, so we can render components without a real browser. Pure-logic tests
    // don't need it, but one env for all keeps the setup simple.
    environment: "jsdom",

    // Expose describe/it/expect as globals (Jest-style), so test files don't
    // import them. Also lets @testing-library auto-clean the DOM between tests.
    globals: true,

    // Runs once before the suite — registers the jest-dom matchers (below).
    setupFiles: ["./vitest.setup.ts"],
  },

  resolve: {
    // Mirror the tsconfig path alias: `@/x` -> `src/x`. Vitest resolves imports
    // itself (it doesn't read tsconfig), so this must be kept in sync by hand.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
