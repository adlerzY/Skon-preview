import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let withBundleAnalyzer = (config) => config;

if (process.env.ANALYZE === 'true') {
  try {
    const bundleAnalyzer = require('@next/bundle-analyzer').default;
    withBundleAnalyzer = bundleAnalyzer({ enabled: true });
  } catch {
  }
}

const nextConfig = {
  poweredByHeader: false,

  images: {
    formats: ['image/webp'],

    deviceSizes: [
      360,
      414,
      640,
      750,
      828,
      1080,
      1200,
      1600,
      1920,
    ],

    imageSizes: [
      16,
      24,
      32,
      48,
      64,
      86,
      96,
      108,
      128,
      256,
      384,
    ],

    qualities: [60, 65, 70, 75, 80, 85, 90],

    minimumCacheTTL: 60 * 60 * 24 * 30,

    dangerouslyAllowLocalIP: true,

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.arena2battle.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'arena2battle.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.arena2battle.com',
        pathname: '/**',
      },
    ],
  },
  compress: true,

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=2592000',
          },
        ],
      },
    ];
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default withBundleAnalyzer(nextConfig);