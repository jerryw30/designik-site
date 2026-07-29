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
  // Serve the standalone portfolio page (public/portfolio/index.html) at a
  // clean /portfolio URL on both dev and Vercel.
  async rewrites() {
    return [{ source: "/portfolio", destination: "/portfolio/index.html" }];
  },
  // Static media never changes in place (updates ship under new filenames),
  // so let browsers and the CDN keep it for a year — repeat visits skip
  // re-downloading the heavy scenes and videos entirely.
  async headers() {
    return [
      {
        source: "/:all*(png|jpg|jpeg|webp|avif|gif|svg|mp4|webm|woff2|woff)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
