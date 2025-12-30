// next.config.ts
import type { NextConfig } from "next";

const posthogIngestionHost =
  process.env.POSTHOG_INGESTION_HOST || "https://eu.i.posthog.com";
const posthogAssetsHost =
  process.env.POSTHOG_ASSETS_HOST || "https://eu-assets.i.posthog.com";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "lodash"],
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
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.yoursite.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "your-s3-bucket.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
