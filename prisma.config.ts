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
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
