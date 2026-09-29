import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";

function gitValue(args: string[]) {
  try {
    return execFileSync("git", args, {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const siteBuildRevision =
  process.env.VERCEL_GIT_COMMIT_SHA?.trim() || gitValue(["rev-parse", "HEAD"]) || "unknown";
const siteBuildBranch =
  process.env.VERCEL_GIT_COMMIT_REF?.trim() || gitValue(["branch", "--show-current"]) || "unknown";
const siteBuildSource = process.env.VERCEL_GIT_COMMIT_SHA ? "vercel" : siteBuildRevision === "unknown" ? "unknown" : "git";

function getDeltaApiOrigin() {
  if (!process.env.NEXT_PUBLIC_DELTA_API_URL) return null;
  try {
    return new URL(process.env.NEXT_PUBLIC_DELTA_API_URL).origin;
  } catch {
    return null;
  }
}

// HQ's auth provider still needs its configured identity service, including after
// client-side navigation to login. Never allow arbitrary/wildcard auth origins.
function getAuthOrigin() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
    return url.protocol === 'https:' && !url.username && !url.password ? url.origin : null;
  } catch { return null; }
}
const authOrigin = getAuthOrigin();
const deltaApiOrigin = getDeltaApiOrigin();
const connectSrc = ["'self'", "https://*.supabase.co", "https://delta-80ht.onrender.com"];
if (deltaApiOrigin && !connectSrc.includes(deltaApiOrigin)) {
  connectSrc.push(deltaApiOrigin);
}

const nextConfig: NextConfig = {
  env: {
    DELTA_SITE_BUILD_REVISION: siteBuildRevision,
    DELTA_SITE_BUILD_BRANCH: siteBuildBranch,
    DELTA_SITE_BUILD_SOURCE: siteBuildSource,
  },

  async headers() {
    return [
      {
        source: '/hq/:path*',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'Content-Security-Policy', value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${authOrigin || ''} ${process.env.NODE_ENV === 'development' ? 'ws://localhost:* ws://127.0.0.1:*' : ''}; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src ${connectSrc.join(" ")}; font-src 'self' data:; frame-ancestors 'none'`,
          },
        ],
      },
      {
        source: '/hq/:path*',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      },
    ];
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Enable compression
  compress: true,

  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: ['framer-motion', '@supabase/supabase-js'],
  },

  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),
};

export default nextConfig;
