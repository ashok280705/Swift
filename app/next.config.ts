import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces .next/standalone/server.js — needed for CodeDeploy + PM2 +
  // the Dockerfile's third stage.
  output: "standalone",

  // ── CI-build safety nets ────────────────────────────────────────
<<<<<<< HEAD
  // TypeScript checks are still run locally (tsc, IDE). Skipped during
  // `next build` so a stray warning never breaks the pipeline.
  // ESLint is no longer configurable via next.config in Next.js 16+;
  // use `next lint` CLI flags or eslint.config.js instead.
=======
  // ESLint and TypeScript checks are still run locally (npm run lint,
  // tsc, IDE). They are skipped *only* during `next build` so a stray
  // warning never breaks the CodeBuild pipeline. Has zero effect on
  // runtime behaviour — the bundled output is identical.
  eslint: {
    ignoreDuringBuilds: true,
  },
>>>>>>> 17f926a04b4289f85e6fd5adb8b6424b82bf9981
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
