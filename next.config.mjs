/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-parse is a CommonJS lib that reads files at runtime — keep it out of the bundle
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

export default nextConfig;
