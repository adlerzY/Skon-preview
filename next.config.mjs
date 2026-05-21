/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'arena2battle.com',
      },
      {
        protocol: 'http',
        hostname: 'tazavesh.local',
      },
    ],
  },
};

export default nextConfig;