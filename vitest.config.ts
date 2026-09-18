import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { configDefaults, defineConfig } from "vitest/config";

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

    // Keep the DB-integration tests (#60) OUT of the default `npm test` run: they
    // need a real throwaway Postgres and run under their own config
    // (vitest.db.config.ts, driven by `npm run test:db`). Excluding them here means
    // `npm test` stays fast and database-free — the pure/component suite CI's main
    // job runs. We spread Vitest's own defaults first, then add our one pattern, so
    // node_modules/dist/etc. stay excluded too.
    exclude: [...configDefaults.exclude, "**/*.db.test.ts"],
  },

  resolve: {
    // Mirror the tsconfig path alias: `@/x` -> `src/x`. Vitest resolves imports
    // itself (it doesn't read tsconfig), so this must be kept in sync by hand.
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
