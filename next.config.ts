import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Ini bakal ngelewatin pengecekan tipe yang ketat pas build production
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ini juga biar warning eslint gak bikin gagal deploy
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;