import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev only: lets phones on the home Wi-Fi open `npm run dev` via the
  // laptop's LAN address (e.g. http://192.168.0.14:3000) to test with friends.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "*.local"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
