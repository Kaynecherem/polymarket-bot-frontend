import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env.API_BASE_URL ?? "http://localhost:18000",
    extraHTTPHeaders: { "Content-Type": "application/json" },
  },
});
