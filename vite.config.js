import { defineConfig } from "vite";

export default defineConfig({
  // Treat .riv files as static assets so preset imports resolve correctly.
  assetsInclude: ["**/*.riv"],
  server: {
    port: 300,
    strictPort: true,
  },
});
