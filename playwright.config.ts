// playwright.config.ts
// The browser tests. Run them with `npm run test:e2e` (e2e/run.ts), which
// builds the throwaway database and starts the app first; `npx playwright
// test` on its own has no app to talk to.

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  // One at a time, in order: the tests share one database and some change it.
  workers: 1,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3210",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  // Phone widths: a small Android and a large iPhone.
  projects: [
    { name: "360", use: { ...devices["Desktop Chrome"], viewport: { width: 360, height: 760 } } },
    { name: "430", use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 900 } } },
  ],
});
