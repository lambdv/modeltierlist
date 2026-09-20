"use client"

import { useState } from "react"
import Link from "next/link"
import { LoaderCircle, LogIn, LogOut } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function AuthButton() {
  const { data: session, isPending } = authClient.useSession()
  const [loginOpen, setLoginOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function signInWithGithub() {
    setBusy(true)
    setError("")
    try {
      const result = await authClient.signIn.social({
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

  async function signOut() {
    setBusy(true)
    setError("")
    try {
      const result = await authClient.signOut()
      if (result.error)
        setError(result.error.message ?? "Sign-out failed. Please try again.")
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
        onClick={session ? signOut : () => setLoginOpen(true)}
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
      {session && error && (
        <p
          role="alert"
          className="absolute top-11 right-0 z-50 w-56 rounded-lg border bg-popover p-3 text-xs text-destructive"
        >
          {error}
        </p>
      )}
      {!session && (
        <Dialog
          open={loginOpen}
          onOpenChange={(open) => {
            setLoginOpen(open)
            if (!open) setError("")
          }}
        >
          <DialogContent className="p-6 sm:max-w-md">
            <DialogHeader className="items-center text-center">
              <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <LogIn className="size-5" />
              </div>
              <DialogTitle className="text-xl">Log in to Modelist</DialogTitle>
              <DialogDescription>
                Sign in to save your model rankings and access your personal list.
              </DialogDescription>
            </DialogHeader>
            <Button
              variant="outline"
              className="mt-2 w-full"
              onClick={signInWithGithub}
              disabled={busy}
            >
              {busy ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.74-1.55-2.57-.29-5.27-1.28-5.27-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.16 1.18A10.96 10.96 0 0 1 12 6.12c.98 0 1.95.13 2.87.39 2.2-1.49 3.16-1.18 3.16-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.71 5.38-5.29 5.67.42.36.79 1.06.79 2.14v3.27c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z" />
                </svg>
              )}
              {busy ? "Connecting…" : "Continue with GitHub"}
            </Button>
            {error && (
              <p role="alert" className="text-center text-xs text-destructive">
                {error}
              </p>
            )}
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to sign in with your GitHub account.
            </p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
