import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["server/__tests__/**/*.test.ts", "src/__tests__/**/*.test.ts", "src/__tests__/**/*.test.tsx"],
    environmentMatchGlobs: [
      ["src/__tests__/**", "jsdom"],
      ["server/__tests__/**", "node"],
    ],
    setupFiles: ["vitest.setup.ts", "vitest.setup.jsdom.ts"],
  },
});
