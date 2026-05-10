import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// For GitHub Pages project sites, set VITE_BASE=/honorific-lattice/ (or your repo name).
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE ?? "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
