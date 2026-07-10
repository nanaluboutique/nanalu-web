# syntax=docker/dockerfile:1

# ---------- Stage 1: builder ----------
# Heavy stage: has all the tooling needed to compile the app.
FROM node:24-alpine AS builder
# Some Node native deps expect this compatibility lib on Alpine Linux.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy only the dependency manifests first. This layer is cached and
# `npm ci` only re-runs when package.json / lockfile change — not on
# every code edit.
COPY package.json package-lock.json ./
RUN npm ci

# Now bring in the rest of the source and build it.
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- Stage 2: migration toolchain ----------
# The standalone build trims node_modules to only what the *running app* imports,
# which drops the Prisma CLI (a devDependency) and `dotenv`. But our release step
# runs `prisma migrate deploy`, which needs both (plus the Prisma engine binaries
# that ship inside `@prisma/engines`). So build a clean, self-contained
# node_modules holding just those two packages — npm resolves their full
# transitive closure for us — to copy into the runner below.
# Alpine base = the engine binaries match the runner's platform (linux-musl).
# Keep these versions in sync with package.json (`prisma`, `dotenv`).
FROM node:24-alpine AS migrate-deps
WORKDIR /mig
RUN npm init -y >/dev/null \
 && npm install --omit=dev prisma@7.8.0 dotenv@17.4.2

# ---------- Stage 3: runner ----------
# Tiny runtime stage: only what's needed to RUN the app — no build tools,
# no dev dependencies.
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Run as a non-root user (security best practice).
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Copy only the standalone output + the assets it serves.
# `output: 'standalone'` produced server.js + a trimmed node_modules;
# static assets and /public are copied alongside it.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# --- Migration toolchain (for `prisma migrate deploy` at release time) ---
# Merge the Prisma CLI + dotenv into the app's node_modules. The two sets are
# disjoint (the app uses @prisma/client; the CLI uses @prisma/engines), so this
# adds files without touching the traced runtime deps the app serves with.
COPY --from=migrate-deps --chown=nextjs:nodejs /mig/node_modules ./node_modules
# The schema + migrations the CLI applies, and the config that supplies the
# datasource URL. `prisma.config.ts` reads process.env.DATABASE_URL (injected by
# Railway at release time); its dotenv call looks for a non-existent .env.local
# in the image and harmlessly no-ops.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts

USER nextjs
EXPOSE 3000
ENV PORT=3000
# Bind to all interfaces so the app is reachable from outside the container.
ENV HOSTNAME=0.0.0.0

# Start the standalone server when the container runs.
CMD ["node", "server.js"]
