const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.join(__dirname, '../..'),
  },
  transpilePackages: ['@platform/ui', '@platform/shared', '@platform/database'],
  serverExternalPackages: ['pg'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.photos.sparkplatform.com',
      },
      {
        protocol: 'https',
        hostname: 'media.placester.com',
      },
    ],
  },
};

module.exports = nextConfig;
