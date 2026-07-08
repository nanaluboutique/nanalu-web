// Prisma 7 config. The Prisma CLI reads the datasource URL from here.
// We load `.env.local` (our single local-env file, gitignored) instead of the
// default `.env`, so there's one place for local values — matching how Next.js
// loads `.env.local` for the app at runtime. See CLAUDE.md → Environment.
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // `prisma db seed` (and `migrate reset`, which auto-seeds) runs this command.
    // Prisma 7 moved seed config here from package.json's old `"prisma"` block.
    // tsx runs the TS seed directly. Node 24 could strip the types itself, but
    // seed.ts imports via our `@/` path alias — and Node ignores tsconfig
    // `paths`, so plain `node` can't resolve it. tsx reads the tsconfig and does.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
