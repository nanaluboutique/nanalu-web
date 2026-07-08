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

# ---------- Stage 2: runner ----------
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

USER nextjs
EXPOSE 3000
ENV PORT=3000
# Bind to all interfaces so the app is reachable from outside the container.
ENV HOSTNAME=0.0.0.0

# Start the standalone server when the container runs.
CMD ["node", "server.js"]
