"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { averageRating, ModelLabel } from "@/components/ui/model-ui/model-ui"
import { Skeleton } from "@/components/ui/skeleton"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { type Model, tiers } from "@/lib/models"
import { latestFromEachProvider } from "./latest-models"

const SEASON_MONTHS = 3
const seasonOptions = [1, 2, 4] as const

function seasonsAgo(seasons: number) {
  const date = new Date()
  date.setMonth(date.getMonth() - seasons * SEASON_MONTHS)
  return date.getTime()
}

export function LandingTierList({ models }: { models: Model[] }) {
  const [rankingSeasons, setRankingSeasons] = React.useState(1)
  const [releaseSeasons, setReleaseSeasons] = React.useState(1)
  const [providerLimit, setProviderLimit] = React.useState(5)
  const rankingSince = React.useMemo(
    () => (rankingSeasons ? seasonsAgo(rankingSeasons) : undefined),
    [rankingSeasons]
  )
  const releaseSince = React.useMemo(
    () => (releaseSeasons ? Math.floor(seasonsAgo(releaseSeasons) / 1000) : undefined),
    [releaseSeasons]
  )
  const stats = useQuery(api.ratings.seasonalCommunity, { since: rankingSince })
  const byId = new Map(stats?.map((entry) => [entry.modelId, entry]))
  const rated = latestFromEachProvider(models, {
    since: releaseSince,
    limit: providerLimit,
  }).filter(
    (model) => (byId.get(model.id)?.count ?? 0) > 0
  )

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <section className="mb-8 w-full rounded-lg border bg-muted/20 p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Sign up to rate models</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;d love to hear your takes.
        </p>
      </section>
      <header className="mb-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Rankings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One season is {SEASON_MONTHS} months. Date ranges end today.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Filter label="Ranking freshness">
            <NativeSelect
              value={rankingSeasons}
              onChange={(event) => setRankingSeasons(Number(event.target.value))}
              aria-label="Ranking freshness"
              className="w-full"
            >
              <SeasonOptions />
            </NativeSelect>
          </Filter>
          <Filter label="Model release date">
            <NativeSelect
              value={releaseSeasons}
              onChange={(event) => setReleaseSeasons(Number(event.target.value))}
              aria-label="Model release date"
              className="w-full"
            >
              <SeasonOptions />
            </NativeSelect>
          </Filter>
          <Filter label="Latest per provider">
            <NativeSelect
              value={providerLimit}
              onChange={(event) => setProviderLimit(Number(event.target.value))}
              aria-label="Latest models per provider"
              className="w-full"
            >
              {[1, 3, 5, 10].map((limit) => (
                <NativeSelectOption key={limit} value={limit}>
                  {limit} models
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Filter>
        </div>
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
                      className="flex max-w-full items-center rounded-md border px-3 py-2 text-sm hover:bg-accent"
                    >
                      <ModelLabel model={model} />
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

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium">
      {label}
      {children}
    </label>
  )
}

function SeasonOptions() {
  return (
    <>
      {seasonOptions.map((seasons) => (
        <NativeSelectOption key={seasons} value={seasons}>
          {seasons === 1 ? "Current season" : `Last ${seasons} seasons`}
        </NativeSelectOption>
      ))}
      <NativeSelectOption value={0}>All time</NativeSelectOption>
    </>
  )
}
