# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage Dockerfile for Swift / CrossRemit (Next.js 16 standalone)
#
# Stages:
#   1. deps    — install node_modules (cached layer)
#   2. builder — run `next build` (produces .next/standalone)
#   3. runner  — minimal production image (~200 MB vs ~1 GB)
#
# Build args (NEXT_PUBLIC_* must be baked in at build time):
#   docker build \
#     --build-arg NEXT_PUBLIC_SUPABASE_URL=https://... \
#     --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_... \
#     --build-arg NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_... \
#     -t swift-app .
#
# Runtime secrets (pass via -e or --env-file at `docker run` time):
#   SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, SERPER_API_KEY, RAZORPAY_KEY_SECRET
# ─────────────────────────────────────────────────────────────────────────────

# ── Base ──────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM base AS deps
WORKDIR /workspace/app

COPY app/package.json app/package-lock.json* ./
# `npm ci` is deterministic and faster than `npm install` in CI
RUN npm ci --prefer-offline

# ── Stage 2: Build ───────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /workspace/app

# Copy source
COPY app/ .
# Bring in installed node_modules from deps stage
COPY --from=deps /workspace/app/node_modules ./node_modules

# Disable telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# ── NEXT_PUBLIC_* vars must be present at build time so Next.js can
#    embed them into the client bundle. Pass them as --build-arg.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_RAZORPAY_KEY_ID

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=$NEXT_PUBLIC_RAZORPAY_KEY_ID

# ── Server-side keys: dummy values at build time (real values injected at runtime)
ENV SUPABASE_SERVICE_ROLE_KEY="dummy-build-key"
ENV GROQ_API_KEY="dummy-build-key"
ENV SERPER_API_KEY="dummy-build-key"
ENV RAZORPAY_KEY_SECRET="dummy-build-key"
ENV RAZORPAY_DEV_MOCK="1"

RUN npm run build

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Static assets
COPY --from=builder /workspace/app/public ./public

# Standalone server output (includes only prod node_modules)
COPY --from=builder --chown=nextjs:nodejs /workspace/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/app/.next/static     ./.next/static

# ── Runtime env vars (override with -e or --env-file at `docker run`) ────────
# NEXT_PUBLIC_* are already baked into the bundle; listed here for clarity.
ENV NEXT_PUBLIC_SUPABASE_URL=""
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ENV NEXT_PUBLIC_RAZORPAY_KEY_ID=""
ENV SUPABASE_SERVICE_ROLE_KEY=""
ENV GROQ_API_KEY=""
ENV SERPER_API_KEY=""
ENV RAZORPAY_KEY_SECRET=""

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000 || exit 1

CMD ["node", "server.js"]
