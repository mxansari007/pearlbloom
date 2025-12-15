// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {

  // appDir option is no longer supported in Next 16+; App Router behavior is implicit.
  reactStrictMode: true,

  images: {
    // Prefer remotePatterns over domains (more secure / flexible).
    // Add entries for any external/CDN hosts you load images from.
    remotePatterns: [
      // Allow images from a specific CDN/host (https://images.example.com/*)
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      // Allow images from an S3 bucket with dynamic subpaths
      {
        protocol: 'https',
        hostname: 'cdn.example-cdn.com',
        port: '',
        pathname: '/**',
      },
      // Example: allow images from any subdomain of media.example.org
      {
        protocol: 'https',
        hostname: '**.media.example.org',
        port: '',
        pathname: '/**',
      },
    ],
  },
  

  // Add other top-level NextConfig options here if needed
  // e.g. experimental, headers, redirects, etc. (but check compatibility first)
}

export default nextConfig
