import type { Metadata } from "next"
import { SiteHeader } from "@/components/ui/site-header/site-header"
import "./globals.css"
import { getToken } from "@/lib/auth-server"
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider"
import { getModels } from "@/lib/openrouter"

export const metadata: Metadata = {
  title: "Modelist",
  description: "AI model ratings and tier lists.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [token, models] = await Promise.all([getToken(), getModels()])

  return (
    <html lang="en" className="dark">
      <body>
        <ConvexClientProvider initialToken={token}>
          <SiteHeader
            models={models.map(({ id, name, provider }) => ({
              id,
              name,
              provider,
            }))}
          />
          {children}
        </ConvexClientProvider>
      </body>
    </html>
  )
}
