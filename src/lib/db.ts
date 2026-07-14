/**
 * The shared Prisma client (#41) — one database connection pool for the whole app.
 *
 * Every server-side read/write goes through this single client. Get it with
 * `getPrisma()` — never call `new PrismaClient()` at a call site, or each one opens
 * its own connection pool. (`prisma/seed.ts` is the one exception: it's a standalone
 * script, not part of the running app, so it builds its own.)
 */

// Marker package: makes this module IMPOSSIBLE to import from a Client Component.
// It ships two files — an empty one under the "react-server" condition (which Next's
// server bundler sets) and one that throws under any other condition. So a `"use
// client"` file importing us fails the build with a clear message instead of an
// obscure "can't bundle node:net for the browser". It also means this module can no
// longer be imported from a plain node/tsx script — verify through the app instead.
import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

// TWO caches, and they do different jobs:
//   `client`               — module-local. The fast path on every call after the first.
//   `globalForPrisma`      — survives `next dev`'s hot reload, which throws the module
//                            (and therefore `client`) away on every save. Without it,
//                            each save would build a NEW pool, leaking connections until
//                            Postgres refuses them with "too many clients already".
// globalThis is not a module, so hot reload can't evict it — that's the whole trick.
let client: PrismaClient | undefined;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

/**
 * The app's one Prisma client, created on FIRST USE — not at import.
 *
 * Laziness is load-bearing, not a style choice: `next build` imports every page module
 * to collect its data, which would evaluate this file. A build never queries the
 * database, and neither our Dockerfile's builder stage nor CI sets DATABASE_URL — so
 * validating the connection string at import time would fail the build outright
 * ("Failed to collect page data for /shop"). Deferring the check to the first actual
 * query keeps builds database-free, which is what makes the Docker image portable.
 */
export function getPrisma(): PrismaClient {
  if (client) return client;

  // Server-only: read WITHOUT the NEXT_PUBLIC_ prefix, so Next never exposes it to the
  // browser (CLAUDE.md → Environment). Next loads `.env.local` for us; unlike
  // prisma/seed.ts we don't call dotenv ourselves.
  //
  // Fail fast with a readable message rather than letting node-postgres fall back to
  // libpq's defaults and die on an opaque ECONNREFUSED (the same guard as the seed).
  const connectionString = process.env["DATABASE_URL"];
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local (see CLAUDE.md → Environment).",
    );
  }

  // Prisma 7 connects through a DRIVER ADAPTER instead of a URL baked into the schema:
  // PrismaPg wraps node-postgres. Identical wiring to prisma/seed.ts.
  client =
    globalForPrisma.prisma ?? new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  // Production evaluates this module exactly once — there's no hot reload to defend
  // against, so we don't pollute the global namespace there.
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}
