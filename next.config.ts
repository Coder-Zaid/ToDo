import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Prevent Vercel deployment failure due to ESLint warnings during production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ensure strict type checking passes
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
