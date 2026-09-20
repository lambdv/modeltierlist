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
    () =>
      releaseSeasons
        ? Math.floor(seasonsAgo(releaseSeasons) / 1000)
        : undefined,
    [releaseSeasons]
  )
  const stats = useQuery(api.ratings.seasonalCommunity, { since: rankingSince })
  const byId = new Map(stats?.map((entry) => [entry.modelId, entry]))
  const rated = latestFromEachProvider(models, {
    since: releaseSince,
    limit: providerLimit,
  }).filter((model) => (byId.get(model.id)?.count ?? 0) > 0)

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="ranking-header">
        <div className="ranking-title-row">
          <h1>Rankings</h1>
          <div className="ranking-filters" aria-label="Ranking filters">
            <Filter label="Ranking freshness">
              <NativeSelect
                value={rankingSeasons}
                onChange={(event) =>
                  setRankingSeasons(Number(event.target.value))
                }
                aria-label="Ranking freshness"
                className="ranking-select"
                size="sm"
              >
                <SeasonOptions />
              </NativeSelect>
            </Filter>
            <Filter label="Model release date">
              <NativeSelect
                value={releaseSeasons}
                onChange={(event) =>
                  setReleaseSeasons(Number(event.target.value))
                }
                aria-label="Model release date"
                className="ranking-select"
                size="sm"
              >
                <SeasonOptions />
              </NativeSelect>
            </Filter>
            <Filter label="Latest per provider">
              <NativeSelect
                value={providerLimit}
                onChange={(event) =>
                  setProviderLimit(Number(event.target.value))
                }
                aria-label="Latest models per provider"
                className="ranking-select"
                size="sm"
              >
                {[1, 3, 5, 10].map((limit) => (
                  <NativeSelectOption key={limit} value={limit}>
                    {limit} models
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Filter>
          </div>
        </div>
      </header>
      <section
        aria-label="Community tier list"
        aria-busy={stats === undefined}
        className="tier-board"
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
            <div key={tier.letter} className="tier-row" data-tier={tier.letter}>
              <div className="tier-label" title={`${tier.stars} stars`}>
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
                      className="model-chip flex max-w-full items-center px-4 py-3 text-sm"
                    >
                      <ModelLabel model={model} />
                    </Link>
                  ))
                ) : null}
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

function Filter({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="ranking-filter">
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
