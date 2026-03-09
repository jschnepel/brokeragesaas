const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: path.join(__dirname, "../..") },
  transpilePackages: ["@platform/database", "@platform/shared"],
  serverExternalPackages: ["pg"],

  // Allow Unsplash images used in seed data
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

module.exports = nextConfig;
