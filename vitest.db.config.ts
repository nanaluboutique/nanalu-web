import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Config for the DB-integration suite (#60), run by `npm run test:db` — NOT by the
// default `npm test` (which excludes *.db.test.ts). These tests drive the real
// catalog queries against a throwaway Postgres, so the setup here is deliberately
// different from vitest.config.ts.
export default defineConfig({
  test: {
    // ONLY the DB tests. The default suite owns everything else.
    include: ["**/*.db.test.ts"],

    // A real Node process, not jsdom: these tests talk to Postgres, they don't
    // render anything, so there's no DOM to emulate.
    environment: "node",

    // Same Jest-style globals (describe/it/expect) as the main config.
    globals: true,

    // Connects to the test DB, guards against non-test URLs, and wipes tables
    // before each test. See the file for the why.
    setupFiles: ["./vitest.db.setup.ts"],

    // Run test FILES one at a time. Every test truncates and repopulates the SAME
    // database, so two files running at once would clobber each other's rows. Serial
    // execution trades a little speed for correctness — the catalog suite is tiny.
    fileParallelism: false,
  },

  resolve: {
    alias: {
      // Mirror the tsconfig path alias (`@/x` -> `src/x`), same as vitest.config.ts.
      "@": fileURLToPath(new URL("./src", import.meta.url)),

      // Redirect `server-only` to an empty module. src/lib/db.ts imports it to stay
      // out of client bundles; loaded in a plain Node test the real package throws,
      // so we swap in a harmless no-op. See test/stubs/server-only.ts.
      "server-only": fileURLToPath(new URL("./test/stubs/server-only.ts", import.meta.url)),
    },
  },
});
