// Setup for the DB-integration suite (#60) — loaded by vitest.db.config.ts before
// every test file. Two responsibilities: refuse to run against anything but a test
// database, and hand each test a clean, empty schema.

import { afterAll, beforeEach } from "vitest";

import { getPrisma } from "@/lib/db";

// ── Safety guard ────────────────────────────────────────────────────────────
// beforeEach() below TRUNCATES every table. If DATABASE_URL ever pointed at the
// dev (or, unthinkably, the production) database, that would wipe real data. So we
// fail LOUDLY on load unless the URL clearly names the throwaway test DB. The two
// markers: port 5433 (only the db-test container listens there) or the database
// name `nanalu_test`. `npm run test:db` sets one that matches both; CI sets a URL
// whose database is `nanalu_test`. Anything else stops the whole run right here.
const url = process.env["DATABASE_URL"] ?? "";
if (!url.includes("5433") && !url.includes("nanalu_test")) {
  throw new Error(
    "Refusing to run DB-integration tests: DATABASE_URL does not look like the test database " +
      `(expected port 5433 or database "nanalu_test"). Got: ${url || "(unset)"}. ` +
      "Run these via `npm run test:db`, which points at the throwaway db-test container.",
  );
}

const prisma = getPrisma();

// ── Clean slate per test ──────────────────────────────────────────────────────
// Delete children before parents so no foreign key is ever left dangling — the same
// FK-safe order prisma/seed.ts uses. Implicit M:N join tables (product⇄category,
// item⇄colour, ...) are cleared automatically when their connected rows go. Running
// before EACH test means every test builds its own fixture from empty and can't be
// polluted by another — which is why the db config also runs test files serially.
beforeEach(async () => {
  await prisma.reservation.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.region.deleteMany();
  await prisma.slot.deleteMany();
  await prisma.customizationConfig.deleteMany();
  await prisma.readyMadeItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.colour.deleteMany();
  await prisma.material.deleteMany();
  await prisma.user.deleteMany();
});

// One shared pool for the whole suite (getPrisma caches it) — close it once at the
// very end so the Node process can exit cleanly instead of hanging on open sockets.
afterAll(async () => {
  await prisma.$disconnect();
});
