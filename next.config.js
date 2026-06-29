/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vopay/shared'],
  images: {
    domains: ['api.dicebear.com', 'avatars.githubusercontent.com'],
  },
  experimental: {
    serverComponentsExternalPackages: [],
  },
};

module.exports = nextConfig;
