const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: path.join(__dirname, "../..") },
  transpilePackages: ["@platform/database", "@platform/shared"],
  serverExternalPackages: ["pg"],
};

module.exports = nextConfig;
