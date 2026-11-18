import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      output: {
        // Give supabase-js (lazy-loaded, see src/lib/supabaseClient.js) a
        // stable chunk name so the service worker can leave it out of the
        // precache. Guests should never download it, not even in the background.
        manualChunks(id) {
          if (id.includes("node_modules/@supabase/")) return "supabase";
        },
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    // Service worker (Workbox). It precaches the app shell (HTML, JS, CSS)
    // and the daily pool JSON, so a returning player loads the app from
    // their own disk: zero bytes from GitHub Pages, and it works offline.
    // Every precached file has a content hash in its name; a new deploy ships
    // a new precache list and the worker swaps it in on the next visit.
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: false, // offline caching only; not an installable app (yet)
      workbox: {
        globPatterns: ["**/*.{js,css,html,json,avif}"],
        globIgnores: ["**/supabase-*.js"],
        runtimeCaching: [
          {
            // Signed-in players get the supabase chunk cached on first use.
            // Its name is content-hashed, so cache-first is always correct.
            urlPattern: /\/assets\/supabase-.*\.js$/,
            handler: "CacheFirst",
            options: { cacheName: "supabase-chunk", expiration: { maxEntries: 2 } },
          },
        ],
        // Videos are deliberately NOT cached by the worker. The <video> tag
        // streams them with HTTP Range requests (206 Partial Content), and a
        // worker can't usefully store partial responses: caching would
        // mean downloading every whole clip. The browser's HTTP cache handles
        // ranges natively, so videos go straight to the network/HTTP cache.
      },
    }),
  ],
});
