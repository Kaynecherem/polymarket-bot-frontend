import { defineConfig, devices } from "@playwright/test";

/**
 * Two test types live in this suite:
 *
 *  1. e2e/api-shape.spec.ts — pure HTTP, hits the backend directly.
 *     Runs without a browser. Uses API_BASE_URL.
 *
 *  2. e2e/cross-page.spec.ts — browser-driven. Loads each frontend page
 *     (next dev or vercel) and asserts numbers correlate across pages.
 *     Uses FRONTEND_URL.
 *
 * Defaults assume an SSH local-forward tunnel: EC2:8000 -> localhost:18000
 * and `npm run dev` running on localhost:3000 against it.
 */
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:18000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: API_BASE_URL,
    extraHTTPHeaders: { "Content-Type": "application/json" },
  },
  webServer: {
    command: `npx next dev --port 3000`,
    url: FRONTEND_URL,
    reuseExistingServer: true,
    timeout: 120_000,
    env: { NEXT_PUBLIC_API_URL: `${API_BASE_URL}/api` },
  },
  projects: [
    {
      name: "api",
      testMatch: /api-shape\.spec\.ts$/,
    },
    {
      name: "browser",
      testMatch: /cross-page\.spec\.ts$/,
      use: {
        ...devices["Desktop Chrome"],
        baseURL: FRONTEND_URL,
      },
    },
  ],
});
