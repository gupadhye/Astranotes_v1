import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "src/core"),
      "@adapters": path.resolve(__dirname, "src/adapters"),
      "@ui": path.resolve(__dirname, "src/ui"),
    },
  },
});
