"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { AuthButton } from "@/components/auth-button"

function CurrentPage({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const current =
    href === "/models"
      ? pathname === href || pathname.startsWith("/model/")
      : pathname === href

  return (
    <Link href={href} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  )
}

export function SiteHeader({ modelCount }: { modelCount: number }) {
  return (
    <header>
      <nav aria-label="Main navigation">
        <strong>
          <Link href="/">Modelist</Link>
        </strong>{" "}
        <CurrentPage href="/">Discover</CurrentPage>{" "}
        <CurrentPage href="/models">Models ({modelCount})</CurrentPage>{" "}
        <CurrentPage href="/my-list">My tier list</CurrentPage>
      </nav>
      <AuthButton />
      <hr />
    </header>
  )
}
