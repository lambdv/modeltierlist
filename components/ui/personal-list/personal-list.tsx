"use client"

import { authClient } from "@/lib/auth-client"
import { AuthButton } from "@/components/ui/auth-button/auth-button"
import { Profile } from "@/components/ui/profile/profile"
import type { Model } from "@/lib/models"

export function PersonalList({ models }: { models: Model[] }) {
  const { data: session, isPending } = authClient.useSession()
  if (session) return <Profile userId={session.user.id} models={models} />
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="mb-4 text-xl font-semibold">My list</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        {isPending ? "Loading…" : "Sign in to rate models."}
      </p>
      <AuthButton />
    </main>
  )
}
