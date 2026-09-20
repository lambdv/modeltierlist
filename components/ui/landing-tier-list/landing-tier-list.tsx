"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { averageRating } from "@/components/ui/model-ui/model-ui"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { type Model, tiers } from "@/lib/models"
import { latestFromEachProvider } from "./latest-models"

export function LandingTierList({ models }: { models: Model[] }) {
  const stats = useQuery(api.ratings.community)
  const byId = new Map(stats?.map((entry) => [entry.modelId, entry]))
  const rated = latestFromEachProvider(models).filter(
    (model) => (byId.get(model.id)?.count ?? 0) > 0
  )

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold">Rankings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last 12 months · 5 latest models per provider
        </p>
      </header>
      <section
        aria-label="Community tier list"
        aria-busy={stats === undefined}
        className="overflow-hidden rounded-lg border"
      >
        {tiers.map((tier) => {
          const entries = rated
            .filter(
              (model) =>
                Math.round(averageRating(byId.get(model.id))) === tier.stars
            )
            .sort(
              (a, b) =>
                averageRating(byId.get(b.id)) - averageRating(byId.get(a.id))
            )
          return (
            <div
              key={tier.letter}
              className="grid min-h-24 grid-cols-[48px_minmax(0,1fr)] border-b last:border-0 sm:grid-cols-[64px_minmax(0,1fr)]"
            >
              <div
                className="flex items-center justify-center border-r bg-muted/30 text-lg font-medium"
                title={`${tier.stars} stars`}
              >
                {tier.letter}
              </div>
              <div className="flex flex-wrap items-center gap-2 p-3">
                {stats === undefined ? (
                  <Skeleton className="h-12 w-48" />
                ) : entries.length ? (
                  entries.map((model) => (
                    <Link
                      key={model.id}
                      href={`/models/${encodeURIComponent(model.id)}`}
                      className="flex max-w-full items-center gap-4 rounded-md border px-3 py-2 text-sm hover:bg-accent"
                    >
                      <span className="min-w-0 truncate">{model.name}</span>
                      <Badge variant="secondary">
                        {averageRating(byId.get(model.id)).toFixed(1)}
                      </Badge>
                    </Link>
                  ))
                ) : (
                  <span
                    className="text-sm text-muted-foreground"
                    aria-label="No rated models"
                  >
                    —
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </section>
      {stats !== undefined && !rated.length && (
        <p className="mt-4 text-sm text-muted-foreground">
          No ratings yet.{" "}
          <Link
            href="/models"
            className="text-foreground underline underline-offset-4"
          >
            Browse models
          </Link>
        </p>
      )}
    </main>
  )
}
