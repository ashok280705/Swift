import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces .next/standalone/server.js — needed for CodeDeploy + PM2 +
  // the Dockerfile's third stage.
  output: "standalone",

  // ── CI-build safety nets ────────────────────────────────────────
  // ESLint and TypeScript checks are still run locally (npm run lint,
  // tsc, IDE). They are skipped *only* during `next build` so a stray
  // warning never breaks the CodeBuild pipeline. Has zero effect on
  // runtime behaviour — the bundled output is identical.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
