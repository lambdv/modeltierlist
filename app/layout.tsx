import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import "./globals.css"
import { getToken } from "@/lib/auth-server"
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider"
import { getModels } from "@/lib/openrouter"

export const metadata: Metadata = {
  title: "Modelist — Find your next coding model",
  description:
    "Discover, rate, and rank coding models. Your experience, the community's perspective.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [token, models] = await Promise.all([getToken(), getModels()])

  return (
    <html lang="en">
      <body>
        <ConvexClientProvider initialToken={token}>
          <SiteHeader modelCount={models.length} />
          {children}
          <hr />
          <footer>Modelist — Built for builders.</footer>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
