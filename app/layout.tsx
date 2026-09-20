import type { Metadata } from "next"
import { Climate_Crisis } from "next/font/google"
import { SiteHeader } from "@/components/ui/site-header/site-header"
import "m3you/styles.css"
import "./globals.css"
import { getToken } from "@/lib/auth-server"
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider"
import { getModels } from "@/lib/openrouter"

const climateCrisis = Climate_Crisis({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-climate-crisis",
})

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
    <html
      lang="en"
      className={`dark ${climateCrisis.variable}`}
      data-theme="dark"
    >
      <body>
        <ConvexClientProvider initialToken={token}>
          <SiteHeader
            models={models.map(({ id, name, provider }) => ({
              id,
              name,
              provider,
            }))}
          />
          <div className="app-content">{children}</div>
        </ConvexClientProvider>
      </body>
    </html>
  )
}
