import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.18.103"],
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  // Serve device-sized WebP through the optimizer — the raw Figma exports
  // total 130MB+ of PNG, far too heavy to ship directly.
  images: {
    formats: ["image/webp"],
    deviceSizes: [390, 640, 768, 1080, 1440, 1920],
    minimumCacheTTL: 2678400,
  },
};

export default nextConfig;
