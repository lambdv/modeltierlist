"use client"

import { authClient } from "@/lib/auth-client"
import { AuthButton } from "@/components/ui/auth-button/auth-button"
import { Profile } from "@/components/ui/profile/profile"
import type { Model } from "@/lib/models"
import { Bookmark } from "lucide-react"
import { Card } from "@/components/ui/card"

export function PersonalList({ models }: { models: Model[] }) {
  const { data: session, isPending } = authClient.useSession()
  if (session) return <Profile userId={session.user.id} models={models} />
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <span className="eyebrow">YOUR PERSONAL PERSPECTIVE</span>
      <h1 className="mt-2 mb-8 text-4xl font-normal">My list</h1>
      <Card className="personal-welcome" variant="filled">
        <span className="personal-welcome-icon">
          <Bookmark size={34} strokeWidth={1.5} />
        </span>
        <h2>A space for your favorites.</h2>
        <p>
          {isPending
            ? "Loading your account…"
            : "Build your own tier list, rate the models you’ve tried, and share your perspective with the community."}
        </p>
        <AuthButton />
      </Card>
    </main>
  )
}
