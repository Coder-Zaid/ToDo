/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: {}, // Clear error about using turbopack with no config
  },
};

export default nextConfig;
