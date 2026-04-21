import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/admin',
  assetPrefix: '/admin',
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "shopzo-ecom-957411489287-us-east-1-an.s3.us-east-1.amazonaws.com",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
