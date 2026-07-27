import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const directory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(directory, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules\/(react|react-dom|scheduler|react-is|use-sync-external-store|loose-envify|js-tokens)\//.test(id)) {
            return "react-vendor";
          }
          if (id.includes("@radix-ui") || id.includes("vaul")) return "ui-vendor";
          if (id.includes("react-hook-form") || id.includes("zod") || id.includes("@hookform")) return "forms-vendor";
          if (id.includes("embla-carousel")) return "carousel-vendor";
          return undefined;
        },
      },
    },
  },
});
