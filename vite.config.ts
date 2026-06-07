import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  root: ".",
  /** Required so packaged Electron can load `dist/index.html` via file:// */
  base: "./",
  publicDir: "public",
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "src/core"),
      "@adapters": path.resolve(__dirname, "src/adapters"),
      "@ui": path.resolve(__dirname, "src/ui"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 5173,
    /** Fail fast if 5173 is taken so Electron always matches Vite. */
    strictPort: true,
  },
});
