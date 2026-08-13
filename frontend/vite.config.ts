import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "RepPlan",
        short_name: "RepPlan",
        description: "Discipline made visible — workout split planner & in-gym logger.",
        theme_color: "#0B0C0F",
        background_color: "#0B0C0F",
        display: "standalone",
        start_url: "/",
        icons: [],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8100",
    },
  },
});
