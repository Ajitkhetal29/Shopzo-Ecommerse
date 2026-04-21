import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/vendor',
  assetPrefix: '/vendor',
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
