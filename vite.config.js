import { defineConfig } from "vite";

export default defineConfig({
  // Treat .riv files as static assets so preset imports resolve correctly.
  assetsInclude: ["**/*.riv"],
  server: {
    port: 3000,
    strictPort: true,
  },
});
