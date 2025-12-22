// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {

  // appDir option is no longer supported in Next 16+; App Router behavior is implicit.
  reactStrictMode: true,

images: {
  domains: [
    "images.unsplash.com",
    "cdn.yoursite.com",
    "res.cloudinary.com",
    "your-s3-bucket.amazonaws.com",
  ],
},
  

  // Add other top-level NextConfig options here if needed
  // e.g. experimental, headers, redirects, etc. (but check compatibility first)
}

export default nextConfig
