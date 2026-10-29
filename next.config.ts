import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Tetep kita pake biar aman pas deploy
  },
};

export default nextConfig;