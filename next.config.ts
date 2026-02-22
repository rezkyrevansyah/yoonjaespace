import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to silence the warning
  turbopack: {},

  // Configure image domains for external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'eowqcksukisenxevutam.supabase.co', // New Singapore database
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'cuhgwiiehdwyircmanzk.supabase.co', // Old Australia database (legacy)
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
