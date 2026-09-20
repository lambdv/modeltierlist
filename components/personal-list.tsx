"use client"

import { useState } from "react"
import Link from "next/link"
import { useConvexAuth, useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Model, tiers } from "@/lib/models"
import { AuthButton } from "@/components/auth-button"
import { Score, type Stats } from "@/components/model-ui"

type Rating = { modelId: string; stars: number }

function modelsInTier(models: Model[], ratings: Rating[], stars: number) {
  return models.filter(
    (model) =>
      (ratings.find((rating) => rating.modelId === model.id)?.stars ?? 0) ===
      stars
  )
}

function communityStatsFor(stats: Stats[] | undefined, modelId: string) {
  return stats?.find((entry) => entry.modelId === modelId)
}

function RatedModel({
  model,
  stars,
  stats,
  busy,
  onMove,
  onDragStart,
  onDragEnd,
}: {
  model: Model
  stars: number
  stats?: Stats
  busy: boolean
  onMove: (modelId: string, stars: number) => void
  onDragStart: (modelId: string) => void
  onDragEnd: () => void
}) {
  return (
    <li
      draggable={!busy}
      onDragStart={() => onDragStart(model.id)}
      onDragEnd={onDragEnd}
    >
      <Link href={`/model/${model.id}`}>
        {model.symbol} {model.name}
      </Link>
      {" — "}
      <Score stats={stats} />{" "}
      <label>
        Your rating{" "}
        <select
          disabled={busy}
          value={stars}
          onChange={(event) => onMove(model.id, Number(event.target.value))}
        >
          <option value={0}>Unrated</option>
          {tiers.map((tier) => (
            <option key={tier.stars} value={tier.stars}>
              {tier.stars} stars
            </option>
          ))}
        </select>
      </label>
    </li>
  )
}

export function PersonalList({ models }: { models: Model[] }) {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const mine = useQuery(api.ratings.mine, isAuthenticated ? {} : "skip")
  const community = useQuery(api.ratings.community)
  const rate = useMutation(api.ratings.rate)
  const [dragging, setDragging] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")

  async function move(modelId: string, stars: number) {
    if (busy || !isAuthenticated) return
    setBusy(true)
    setMessage("")
    try {
      await rate({
        modelId,
        stars: stars === 0 ? null : (stars as 1 | 2 | 3 | 4 | 5),
      })
      setMessage("Tier list saved.")
    } catch {
      setMessage("Couldn't save your change. Please try again.")
    } finally {
      setBusy(false)
      setDragging(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <main>
        <h1>My tier list</h1>
        <p>
          {isLoading
            ? "Loading…"
            : "Sign in to rate models and save your tier list."}
        </p>
        <AuthButton />
      </main>
    )
  }

  const ratings = mine ?? []
  const allTiers = [
    ...tiers,
    { stars: 0, letter: "—", label: "Not rated", color: "neutral" },
  ]

  return (
    <main>
      <h1>My tier list</h1>
      <p>
        {ratings.length} models rated. Drag a model to another tier or use its
        rating menu.
      </p>
      <p role="status">
        {busy ? "Saving…" : message || "Changes save automatically."}
      </p>
      {mine === undefined ? (
        <p>Loading your models…</p>
      ) : (
        allTiers.map((tier) => {
          const entries = modelsInTier(models, ratings, tier.stars)
          return (
            <section
              key={tier.stars}
              onDragOver={(event) => {
                if (!busy && dragging) event.preventDefault()
              }}
              onDrop={(event) => {
                event.preventDefault()
                if (dragging) void move(dragging, tier.stars)
              }}
            >
              <h2>
                {tier.letter}: {tier.label}
              </h2>
              {entries.length ? (
                <ul>
                  {entries.map((model) => (
                    <RatedModel
                      key={model.id}
                      model={model}
                      stars={tier.stars}
                      stats={communityStatsFor(community, model.id)}
                      busy={busy}
                      onMove={move}
                      onDragStart={setDragging}
                      onDragEnd={() => setDragging(null)}
                    />
                  ))}
                </ul>
              ) : (
                <p>Drop a model here.</p>
              )}
            </section>
          )
        })
      )}
    </main>
  )
}
