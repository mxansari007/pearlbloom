// next.config.ts
import type { NextConfig } from "next";

const posthogIngestionHost =
  process.env.POSTHOG_INGESTION_HOST || "https://eu.i.posthog.com";
const posthogAssetsHost =
  process.env.POSTHOG_ASSETS_HOST || "https://eu-assets.i.posthog.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "lodash", "react-icons"],
  },

  async rewrites() {
    return [
      {
        source: "/ph/static/:path*",
        destination: `${posthogAssetsHost}/static/:path*`,
      },
      {
        source: "/ph/array/:path*",
        destination: `${posthogAssetsHost}/array/:path*`,
      },
      {
        source: "/ph/:path*",
        destination: `${posthogIngestionHost}/:path*`,
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
