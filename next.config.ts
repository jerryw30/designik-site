import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.18.103"],
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  // Brand assets are pre-exported from Figma at final dimensions, so we serve
  // them directly rather than re-encoding through the on-demand optimizer.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
