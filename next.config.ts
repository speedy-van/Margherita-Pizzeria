import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  // Legacy Google Ads landing URLs collapsed into the canonical order flow.
  // Public ad URLs are now only /order and /order/success.
  async redirects() {
    return [
      { source: "/lp/order-now", destination: "/order", permanent: true },
      { source: "/lp/collection", destination: "/order", permanent: true },
      {
        source: "/lp/order-now/success",
        destination: "/order/success",
        permanent: true,
      },
    ];
  },
  // Development-only CORS for local admin tooling. Production returns no
  // CORS headers, so the public site and native apps are unchanged.
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
