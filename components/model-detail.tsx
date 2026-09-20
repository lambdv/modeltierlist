"use client"

import Link from "next/link"
import { useState } from "react"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Model, tiers } from "@/lib/models"
import { averageRating, StarRating } from "@/components/model-ui"
import { AuthButton } from "@/components/auth-button"

function ModelOverview({ model }: { model: Model }) {
  return (
    <section>
      <h2>Overview</h2>
      <p>{model.description}</p>
      <dl>
        <dt>Provider</dt>
        <dd>{model.provider}</dd>
        <dt>Family</dt>
        <dd>{model.family}</dd>
        <dt>Access</dt>
        <dd>{model.access}</dd>
        <dt>Tags</dt>
        <dd>{model.tags.join(", ")}</dd>
      </dl>
      {model.access === "Unverified" && (
        <p>Availability and technical specifications have not been verified.</p>
      )}
    </section>
  )
}

function CommunityRating({
  stats,
}: {
  stats?: { count: number; total: number; distribution: number[] }
}) {
  return (
    <section>
      <h2>Community rating</h2>
      <p>
        {stats?.count
          ? `${averageRating({ ...stats, modelId: "" }).toFixed(1)} / 5 from ${stats.count} ratings`
          : "Not rated yet."}
      </p>
      {stats?.count ? (
        <ul>
          {tiers.map((tier) => (
            <li key={tier.stars}>
              {tier.stars} stars: {stats.distribution[tier.stars - 1] ?? 0}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export function ModelDetail({ model }: { model: Model }) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const stats = useQuery(api.ratings.community)?.find(
    (entry) => entry.modelId === model.id
  )
  const mine = useQuery(api.ratings.mine, isAuthenticated ? {} : "skip")
  const rating = mine?.find((entry) => entry.modelId === model.id)?.stars ?? 0
  const rate = useMutation(api.ratings.rate)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  async function save(stars: 1 | 2 | 3 | 4 | 5 | null) {
    setBusy(true)
    setMessage("")
    try {
      await rate({ modelId: model.id, stars })
      setMessage(stars ? "Rating saved." : "Rating removed.")
    } catch {
      setMessage("Couldn't save your rating. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <main>
      <p>
        <Link href="/models">Back to all models</Link>
      </p>
      <h1>
        {model.symbol} {model.name}
      </h1>
      <p>
        {model.provider} · {model.family} · {model.status}
      </p>
      <ModelOverview model={model} />
      <CommunityRating stats={stats} />
      <section>
        <h2>Your rating</h2>
        {isAuthenticated ? (
          <>
            <StarRating
              value={rating}
              disabled={busy || mine === undefined}
              onChange={save}
            />
            {rating > 0 && (
              <button type="button" disabled={busy} onClick={() => save(null)}>
                Remove rating
              </button>
            )}
          </>
        ) : (
          <>
            <p>
              {isLoading
                ? "Checking your session…"
                : "Sign in to rate this model."}
            </p>
            <AuthButton />
          </>
        )}
        <p role="status">{busy ? "Saving…" : message}</p>
        <p>
          <Link href="/my-list">View your tier list</Link>
        </p>
      </section>
    </main>
  )
}
