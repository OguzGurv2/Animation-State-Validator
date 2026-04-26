import { defineConfig } from "vite";

export default defineConfig({
  assetsInclude: ["**/*.riv"],
  server: {
    port: 300,
    strictPort: true,
  },
});
