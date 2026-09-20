"use client"

import { useState } from "react"
import { authClient } from "@/lib/auth-client"

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
            callbackURL: window.location.href,
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
    <div>
      {session && <span>{session.user.name} </span>}
      <button type="button" onClick={authenticate} disabled={busy || isPending}>
        {busy || isPending
          ? "Please wait…"
          : session
            ? "Sign out"
            : "Sign in with GitHub"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
