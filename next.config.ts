import type { NextConfig } from "next"

if (
  process.env.VERCEL_ENV === "production" &&
  process.env.CONVEX_DEPLOYMENT?.startsWith("dev:")
) {
  throw new Error(
    "Refusing to build production with a development Convex deployment."
  )
}

const connectSources = [
  process.env.NEXT_PUBLIC_CONVEX_URL,
  process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
]
  .filter(Boolean)
  .flatMap((value) => {
    try {
      const url = new URL(value!)
      const sources = [url.origin]
      if (url.protocol === "https:") {
        url.protocol = "wss:"
        sources.push(url.origin)
      } else if (url.protocol === "http:") {
        url.protocol = "ws:"
        sources.push(url.origin)
      }
      return sources
    } catch {
      return []
    }
  })
  .filter(Boolean)
  .join(" ")

const scriptSources =
  process.env.NODE_ENV === "development"
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'"

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  `connect-src 'self' ${connectSources}`.trim(),
  "font-src 'self' data:",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: https:",
  "object-src 'none'",
  `script-src ${scriptSources}`,
  "style-src 'self' 'unsafe-inline'",
  "upgrade-insecure-requests",
].join("; ")

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), geolocation=(), microphone=(), payment=(), usb=()",
          },
        ],
      },
    ]
  },
}

export default nextConfig
