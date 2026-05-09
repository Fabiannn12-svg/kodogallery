import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-51fe967085d14b2b8eeccb203cfbd818.r2.dev",
      },
    ],
  },
};

export default nextConfig;
