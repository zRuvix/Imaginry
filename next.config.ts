import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Keep old links working: sponsor terms moved from /sponsor/terms, and the
  // agents (MCP) and pricing pages became sections of the landing.
  async redirects() {
    return [
      { source: "/sponsor/terms", destination: "/sponsor-terms", permanent: true },
      { source: "/agents", destination: "/#agents", permanent: true },
      { source: "/pricing", destination: "/#pricing", permanent: true },
    ];
  },
  // OAuth discovery for MCP apps. Clients ask at the root, or with the resource
  // path appended (/.well-known/oauth-protected-resource/mcp).
  async rewrites() {
    return [
      { source: "/.well-known/oauth-protected-resource/:path*", destination: "/api/oauth/resource" },
      { source: "/.well-known/oauth-authorization-server/:path*", destination: "/api/oauth/metadata" },
      { source: "/.well-known/openid-configuration/:path*", destination: "/api/oauth/metadata" },
    ];
  },
  // The Allow / Deny screen must never load inside another site's frame.
  async headers() {
    return [
      {
        source: "/oauth/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
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
