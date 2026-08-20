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
        theme_color: "#0C0B08",
        background_color: "#0C0B08",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
          { src: "/icons/icon-180.png", sizes: "180x180", type: "image/png" },
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          { name: "Start a workout", short_name: "Log", url: "/app/log", icons: [{ src: "/icons/icon-180.png", sizes: "180x180" }] },
          { name: "View plan", short_name: "Plan", url: "/app/plan" },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:8100",
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          query: ["@tanstack/react-query"],
        },
      },
    },
  },
});
