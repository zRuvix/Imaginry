import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Sponsor terms moved from /sponsor/terms; keep old links working.
  async redirects() {
    return [{ source: "/sponsor/terms", destination: "/sponsor-terms", permanent: true }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  // The headless Chromium used for server-side PNG renders ships its binary as files.
  outputFileTracingIncludes: {
    "/api/png": ["./node_modules/@sparticuz/chromium/bin/**"],
    "/mcp": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
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
