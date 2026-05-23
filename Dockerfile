<<<<<<< HEAD
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

=======
# Use the lightweight Alpine Linux version of Node.js 20
FROM node:20-alpine AS base

# -----------------------------------------------------------------------------
# Stage 1: Install dependencies
# -----------------------------------------------------------------------------
FROM base AS deps
# Install libc6-compat which is required by some Node modules on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /workspace

# Copy only the package.json and lock file to leverage Docker layer caching
COPY app/package.json app/package-lock.json* ./app/
WORKDIR /workspace/app
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: Build the application
# -----------------------------------------------------------------------------
FROM base AS builder
WORKDIR /workspace
# Copy the rest of the application code
COPY app/ ./app/
# Copy the installed node_modules from the 'deps' stage
COPY --from=deps /workspace/app/node_modules ./app/node_modules

WORKDIR /workspace/app
# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED 1

# Accept NEXT_PUBLIC variables at build time so Next.js can compile them into the frontend
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Provide dummy values for backend keys during build to prevent API routes from crashing Next.js compilation
ENV SUPABASE_SERVICE_ROLE_KEY="dummy-build-key"
ENV GROQ_API_KEY="dummy-build-key"
ENV SERPER_API_KEY="dummy-build-key"

# Build the Next.js app (Since next.config.ts has output: "standalone",  
# this generates a highly optimized minimal server folder)
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 3: Production Server (Lightweight Image)
# -----------------------------------------------------------------------------
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy only the necessary public assets
COPY --from=builder /workspace/app/public ./public

# Set proper permissions for the .next directory
RUN mkdir .next
RUN chown nextjs:nodejs .next

# The standalone output contains ONLY the files and node_modules necessary to run the server.
# This removes all devDependencies and unused code from the final image!
COPY --from=builder --chown=nextjs:nodejs /workspace/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/app/.next/static ./.next/static

# Switch to the non-root user
>>>>>>> 17f926a04b4289f85e6fd5adb8b6424b82bf9981
USER nextjs

EXPOSE 3000

<<<<<<< HEAD
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget -qO- http://localhost:3000 || exit 1

=======
ENV PORT 3000
# Listen on all network interfaces
ENV HOSTNAME "0.0.0.0"

# Application Environment Variables (Override these at runtime via docker run -e)
ENV NEXT_PUBLIC_SUPABASE_URL=""
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=""
ENV SUPABASE_SERVICE_ROLE_KEY=""
ENV GROQ_API_KEY=""
ENV SERPER_API_KEY=""

# Start the standalone server (not npm start)
>>>>>>> 17f926a04b4289f85e6fd5adb8b6424b82bf9981
CMD ["node", "server.js"]
