import type { NextConfig } from "next";

// Serve a different favicon per environment (prod stays untouched) so tabs
// are easy to tell apart at a glance — no more wondering why prod doesn't
// reflect a change you only made locally or in a preview deploy.
const FAVICONS = {
  preview: "/favicon.preview.png",
  development: "/favicon.development.png",
} as const;

const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
const favicon = FAVICONS[env as keyof typeof FAVICONS];

const nextConfig: NextConfig = {
  async rewrites() {
    if (!favicon) return [];

    return {
      beforeFiles: [{ source: "/favicon.png", destination: favicon }],
    };
  },
};

export default nextConfig;
