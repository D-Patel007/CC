import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Next 15: prisma must remain external so its engines load correctly
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default nextConfig;
