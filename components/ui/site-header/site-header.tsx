"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AuthButton } from "@/components/ui/auth-button/auth-button"
import { ModelSearch } from "@/components/ui/model-search/model-search"
import { cn } from "@/lib/utils"

type HeaderModel = { id: string; name: string; provider: string }

export function SiteHeader({ models }: { models: HeaderModel[] }) {
  const pathname = usePathname()
  return (
    <header className="border-b">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex min-h-14 max-w-5xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6"
      >
        <Link href="/" className="text-sm font-semibold">
          Modelist
        </Link>
        <div className="flex gap-4 text-sm">
          {[
            ["/", "Rankings"],
            ["/models", "Models"],
            ["/my-list", "My list"],
          ].map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className={cn(
                "text-muted-foreground hover:text-foreground",
                pathname === href && "text-foreground"
              )}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ModelSearch models={models} />
          <AuthButton />
        </div>
      </nav>
    </header>
  )
}
