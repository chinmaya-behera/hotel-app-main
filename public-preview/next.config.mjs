import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/department',
        destination: '/staff/department-manager',
      },
      {
        source: '/department-manager',
        destination: '/staff/department-manager',
      },
      {
        source: '/fulfiller',
        destination: '/staff/fulfiller',
      },
    ];
  },
};

export default nextConfig;
