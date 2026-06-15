import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
    include: ["server/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
