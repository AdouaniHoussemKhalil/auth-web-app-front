// vite.config.ts de VOTRE application React : en développement, /auth et /api sont
// redirigés vers votre back (server.mjs). Même origine pour le navigateur : pas de CORS à configurer.
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/auth": "http://localhost:3001",
      "/api": "http://localhost:3001",
    },
  },
});
