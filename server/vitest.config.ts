import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

const testEnv = loadEnv("test", process.cwd(), "");
const testDatabaseUrl = testEnv.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error("TEST_DATABASE_URL must be configured before running server tests");
}

const testDatabaseName = new URL(testDatabaseUrl).pathname.replace(/^\//, "");
if (testDatabaseName !== "toktickit_test") {
  throw new Error("Server tests may only run against the dedicated toktickit_test database");
}

process.env.DATABASE_URL = testDatabaseUrl;
process.env.NODE_ENV = "test";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
  },
});
