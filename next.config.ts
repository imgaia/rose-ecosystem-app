/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import type { NextConfig } from "next";
import "./src/env.js";
// Validates rules.yaml; throws (and stops dev, build and start) if it is invalid.
import "./src/server/rules/index";

const config: NextConfig = {
  // The browser tests (e2e/run.ts) build into .next-e2e, so a dev server using .next keeps running.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // The rules loader reads rules.yaml from disk at runtime, so make sure
  // Vercel ships the file with every server function.
  outputFileTracingIncludes: {
    "/**/*": ["./src/server/rules/rules.yaml"],
  },
};

export default config;
