import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow localhost generally
    domains: ["localhost"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/berita/**",
      },
    ],
  },
};

export default nextConfig;
