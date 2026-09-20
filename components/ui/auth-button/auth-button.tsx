"use client"

import { useState } from "react"
import Link from "next/link"
import { LoaderCircle, LogIn, LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"

export function AuthButton() {
  const { data: session, isPending } = authClient.useSession()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function authenticate() {
    setBusy(true)
    setError("")
    try {
      const result = session
        ? await authClient.signOut()
        : await authClient.signIn.social({
            provider: "github",
            callbackURL: "/",
          })
      if (result.error)
        setError(result.error.message ?? "Sign-in failed. Please try again.")
    } catch {
      setError("Unable to connect. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex items-center gap-3">
      {session && (
        <Link
          href={`/user/${encodeURIComponent(session.user.id)}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          aria-label="View your profile"
        >
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="size-8 rounded-lg object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
              {session.user.name.slice(0, 1).toUpperCase()}
            </span>
          )}
        </Link>
      )}
      <Button
        variant="outline"
        onClick={authenticate}
        disabled={busy || isPending}
      >
        {busy || isPending ? (
          <LoaderCircle className="animate-spin" />
        ) : session ? (
          <LogOut />
        ) : (
          <LogIn />
        )}
        {busy || isPending ? "Loading…" : session ? "Sign out" : "Sign in"}
      </Button>
      {error && (
        <p
          role="alert"
          className="absolute top-11 right-0 z-50 w-56 rounded-lg border bg-popover p-3 text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  )
}
