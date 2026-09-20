import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**", // Matches any domain
      },
      {
        protocol: "http",
        hostname: "**", // Matches any domain (optional, if you need HTTP)
      },
    ],
  },
}

export default nextConfig
