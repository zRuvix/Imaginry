import type { NextConfig } from "next";

const RYBBIT_HOST = "https://stats.zruvix.com";
const UMAMI_HOST = "https://umi.bhaskarsaikia.dev";

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
      // Rybbit analytics served first-party, so blockers that drop third-party
      // stats hosts let it through. The script calls back to the folder its src
      // sits in (/_v/track, /_v/site/..., /_v/identify), so one prefix covers all.
      { source: "/_v/:path*", destination: `${RYBBIT_HOST}/api/:path*` },
      // Umami the same way: it posts to <script folder>/api/send, so /_u/script.js
      // sends to /_u/api/send.
      { source: "/_u/:path*", destination: `${UMAMI_HOST}/:path*` },
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
