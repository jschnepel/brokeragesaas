/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@platform/ui', '@platform/shared'],
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
    ],
  },
};

module.exports = nextConfig;
