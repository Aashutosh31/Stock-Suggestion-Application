import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    testTimeout: 30000,
    hookTimeout: 60000,
    pool: "forks",
  },
});
