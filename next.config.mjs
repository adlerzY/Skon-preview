/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, 
    
    minimumCacheTTL: 31536000,
    qualities: [70, 75, 80, 85, 90],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'arena2battle.com',
      },
      {
        protocol: 'http',
        hostname: 'tazavesh.local',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
