import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  // Dev-only CORS so the Expo debug harness at http://localhost:8081 can
  // call /api/* from a browser. Production returns no CORS headers, so the
  // public site / native Kotlin app behaviour is unchanged.
  async headers() {
    if (!isDev) return [];
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, x-dev-admin",
          },
          { key: "Access-Control-Max-Age", value: "600" },
        ],
      },
    ];
  },
};

export default nextConfig;
