/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

const nextIntlPlugin = createNextIntlPlugin();

const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'api.slingacademy.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: '*',
        port: ''
      }
    ]
  },
  transpilePackages: ['geist'],
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  }
};

module.exports = nextIntlPlugin(nextConfig);
