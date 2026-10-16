// Setup for the DB-integration suite (#60) — loaded by vitest.db.config.ts before
// every test file. Two responsibilities: refuse to run against anything but a test
// database, and hand each test a clean, empty schema.

import { afterAll, beforeEach } from "vitest";

import { getPrisma } from "@/lib/db";

import { resetDatabase } from "./prisma/reset";

// ── Safety guard ────────────────────────────────────────────────────────────
// beforeEach() below TRUNCATES every table. If DATABASE_URL ever pointed at the
// dev (or, unthinkably, the production) database, that would wipe real data. So we
// fail LOUDLY on load unless the URL clearly names the throwaway test DB. The two
// markers: port 5433 (only the db-test container listens there) or the database
// name `nanalu_test`. `npm run test:db` sets one that matches both; CI sets a URL
// whose database is `nanalu_test`. Anything else stops the whole run right here.
//
// PARSE the URL and match the port/database EXACTLY — never a substring scan of the
// raw string. A production URL whose random proxy port merely CONTAINS "5433"
// (e.g. `:35433`) or whose password happens to hold those digits would sail past a
// naive `includes()` and get its tables wiped. An unparseable/empty URL fails closed.
const url = process.env["DATABASE_URL"] ?? "";

function looksLikeTestDb(connectionString: string): boolean {
  try {
    const parsed = new URL(connectionString);
    const database = parsed.pathname.replace(/^\//, ""); // "/nanalu_test" -> "nanalu_test"
    return parsed.port === "5433" || database === "nanalu_test";
  } catch {
    return false; // empty or malformed — definitely not our test DB, so refuse
  }
}

if (!looksLikeTestDb(url)) {
  throw new Error(
    "Refusing to run DB-integration tests: DATABASE_URL does not look like the test database " +
      `(expected port 5433 or database "nanalu_test"). Got: ${url || "(unset)"}. ` +
      "Run these via `npm run test:db`, which points at the throwaway db-test container.",
  );
}

const prisma = getPrisma();

// ── Clean slate per test ──────────────────────────────────────────────────────
// resetDatabase wipes every table in FK-safe order — the SAME helper prisma/seed.ts
// uses before reseeding, so the delete order lives in one place (prisma/reset.ts) and
// can't drift between the two. Running before EACH test means every test builds its
// own fixture from empty and can't be polluted by another — which is why the db config
// also runs test files serially.
beforeEach(async () => {
  await resetDatabase(prisma);
});

// One shared pool for the whole suite (getPrisma caches it) — close it once at the
// very end so the Node process can exit cleanly instead of hanging on open sockets.
afterAll(async () => {
  await prisma.$disconnect();
});
