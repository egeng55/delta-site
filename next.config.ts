import type { NextConfig } from "next";

function getDeltaApiOrigin() {
  if (!process.env.NEXT_PUBLIC_DELTA_API_URL) return null;
  try {
    return new URL(process.env.NEXT_PUBLIC_DELTA_API_URL).origin;
  } catch {
    return null;
  }
}

const deltaApiOrigin = getDeltaApiOrigin();
const connectSrc = ["'self'", "https://*.supabase.co", "https://delta-80ht.onrender.com"];
if (deltaApiOrigin && !connectSrc.includes(deltaApiOrigin)) {
  connectSrc.push(deltaApiOrigin);
}

const nextConfig: NextConfig = {
  async headers() {
    return [
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
