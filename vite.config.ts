import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        manifestFilename: "manifest.webmanifest",
        devOptions: {
          enabled: true,
        },
        manifest: {
          name: "CommunityAid",
          short_name: "CommunityAid",
          description: "Community emergency response platform",
          theme_color: "#ffffff",
          background_color: "#ffffff",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "/icons/icon-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icons/icon-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: new RegExp(`^${apiBaseUrl}`),
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                networkTimeoutSeconds: 10,
              },
            },
            {
              urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/,
              handler: "CacheFirst",
              options: {
                cacheName: "map-tiles",
                expiration: {
                  maxEntries: 500,
                  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
                },
              },
            },
          ],
        },
      }),
    ],
  };
});
