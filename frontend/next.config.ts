import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly enable Turbopack
  turbopack: {},

  // You can still keep other valid experimental features here if needed
  experimental: {},
};

export default nextConfig;
