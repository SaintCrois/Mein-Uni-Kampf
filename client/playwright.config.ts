import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const configDirectory = path.dirname(fileURLToPath(import.meta.url));
const testEnv = loadEnv("test", path.resolve(configDirectory, "../server"), "");
const testDatabaseUrl = testEnv.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL must be configured before running E2E tests");
}

if (new URL(testDatabaseUrl).pathname.replace(/^\//, "") !== "toktickit_test") {
  throw new Error("E2E tests may only run against the dedicated toktickit_test database");
}

export default defineConfig({
  testDir: "../e2e",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npm --prefix ../server run dev",
      url: "http://localhost:3000/api/health",
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
        NODE_ENV: "test",
      },
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: "npm run dev -- --host 0.0.0.0",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 800, height: 1000 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
