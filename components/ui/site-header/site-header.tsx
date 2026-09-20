"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bookmark, Boxes, FlaskConical, Trophy } from "lucide-react"
import LatticeLoader from "@/components/LatticeLoader"
import { AuthButton } from "@/components/ui/auth-button/auth-button"
import { ModelSearch } from "@/components/ui/model-search/model-search"
import { cn } from "@/lib/utils"

type HeaderModel = { id: string; name: string; provider: string }
const destinations = [
  { href: "/", label: "Rankings", icon: Trophy },
  { href: "/models", label: "Models", icon: Boxes },
  { href: "/labs", label: "Labs", icon: FlaskConical },
  { href: "/my-list", label: "My list", icon: Bookmark },
]

export function SiteHeader({ models }: { models: HeaderModel[] }) {
  const pathname = usePathname()

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="app-header">
        <div className="app-bar">
          <Link href="/" className="brand" aria-label="Model Tier List home">
            <LatticeLoader
              className="brand-loader"
              status="working"
              label=""
              pattern="orbit"
              grid={3}
              shape="round"
              color="var(--primary)"
              cellSize={6}
              gap={2}
              fontSize={14}
              step={135}
              idleOpacity={0.15}
              glow
              showTimer={false}
              elapsed={undefined}
              style={undefined}
            />
            <p className="brand-title">Model Tier List</p>
          </Link>
          <div className="header-actions">
            <ModelSearch models={models} />
            <AuthButton />
          </div>
        </div>
      </header>
      <nav className="navigation-rail" aria-label="Main navigation">
        {destinations.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== "/" && pathname.startsWith(`${href}/`))
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn("rail-item", active && "rail-item-active")}
            >
              <span className="rail-icon">
                <Icon size={22} strokeWidth={active ? 2 : 1.7} />
              </span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>
      <span id="main-content" tabIndex={-1} />
    </>
  )
}
