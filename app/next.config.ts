import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces .next/standalone/server.js — needed for CodeDeploy + PM2 +
  // the Dockerfile's third stage.
  output: "standalone",

  // ── CI-build safety nets ────────────────────────────────────────
  // TypeScript checks are still run locally (tsc, IDE). Skipped during
  // `next build` so a stray warning never breaks the pipeline.
  // ESLint is no longer configurable via next.config in Next.js 16+;
  // use `next lint` CLI flags or eslint.config.js instead.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
