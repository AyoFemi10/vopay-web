/** @type {import('next').NextConfig} */

const DOCS_URL = process.env.DOCS_URL || 'http://localhost:3001';

const nextConfig = {
  images: {
    domains: ['api.dicebear.com', 'avatars.githubusercontent.com'],
  },
  serverExternalPackages: [],

  // Proxy /docs/* to the standalone docs app (apps/docs, port 3001)
  async rewrites() {
    return [
      {
        source: '/docs',
        destination: `${DOCS_URL}/docs`,
      },
      {
        source: '/docs/:path*',
        destination: `${DOCS_URL}/docs/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
