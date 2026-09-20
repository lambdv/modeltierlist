"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Model, tiers } from "@/lib/models"
import {
  averageRating,
  ModelCard,
  Score,
  type Stats,
} from "@/components/model-ui"

type View = "tier" | "grid"
type Filters = {
  search: string
  provider: string
  openOnly: boolean
  sort: string
}

function findStats(stats: Stats[] | undefined, modelId: string) {
  return stats?.find((entry) => entry.modelId === modelId)
}

function filterAndSortModels(models: Model[], filters: Filters, stats?: Stats[]) {
  const query = filters.search.trim().toLowerCase()
  return models
    .filter((model) => {
      const searchable =
        `${model.name} ${model.provider} ${model.tags.join(" ")}`.toLowerCase()
      return (
        (!query || searchable.includes(query)) &&
        (filters.provider === "All providers" ||
          model.provider === filters.provider) &&
        (!filters.openOnly || model.access === "Open weights")
      )
    })
    .sort((a, b) => compareModels(a, b, filters.sort, stats))
}

function compareModels(a: Model, b: Model, sort: string, stats?: Stats[]) {
  if (sort === "name") return a.name.localeCompare(b.name)
  const aStats = findStats(stats, a.id)
  const bStats = findStats(stats, b.id)
  if (sort === "votes") return (bStats?.count ?? 0) - (aStats?.count ?? 0)
  return averageRating(bStats) - averageRating(aStats)
}

function CatalogIntro({
  browse,
  modelCount,
  voteCount,
}: {
  browse: boolean
  modelCount: number
  voteCount?: number
}) {
  return (
    <section>
      <h1>
        {browse
          ? "Find your next coding companion"
          : "Good code starts with the right model"}
      </h1>
      <p>
        Discover coding models, rate your favorites, and see where the community
        stands.
      </p>
      <p>
        <Link href="/my-list">Build your tier list</Link>
      </p>
      <p>
        {modelCount} models · {voteCount ?? "Loading"} community ratings
      </p>
    </section>
  )
}

function CatalogFilters({
  models,
  filters,
  setFilters,
}: {
  models: Model[]
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
}) {
  const update = (change: Partial<Filters>) =>
    setFilters((current) => ({ ...current, ...change }))
  const providers = [
    "All providers",
    ...new Set(models.map((model) => model.provider)),
  ]

  return (
    <fieldset>
      <legend>Filter and sort</legend>
      <label>
        Search{" "}
        <input
          value={filters.search}
          onChange={(event) => update({ search: event.target.value })}
        />
      </label>{" "}
      <label>
        Provider{" "}
        <select
          value={filters.provider}
          onChange={(event) => update({ provider: event.target.value })}
        >
          {providers.map((provider) => (
            <option key={provider}>{provider}</option>
          ))}
        </select>
      </label>{" "}
      <label>
        <input
          type="checkbox"
          checked={filters.openOnly}
          onChange={(event) => update({ openOnly: event.target.checked })}
        />{" "}
        Open weights only
      </label>{" "}
      <label>
        Sort{" "}
        <select
          value={filters.sort}
          onChange={(event) => update({ sort: event.target.value })}
        >
          <option value="rating">Highest rated</option>
          <option value="votes">Most rated</option>
          <option value="name">Name A–Z</option>
        </select>
      </label>{" "}
      <button
        type="button"
        onClick={() =>
          setFilters({
            search: "",
            provider: "All providers",
            openOnly: false,
            sort: "rating",
          })
        }
      >
        Clear
      </button>
    </fieldset>
  )
}

function TierList({ entries, stats }: { entries: Model[]; stats?: Stats[] }) {
  const allTiers = [
    ...tiers,
    { stars: 0, letter: "—", label: "Unranked", color: "neutral" },
  ]
  return (
    <>
      {allTiers.map((tier) => {
        const tierModels = entries.filter(
          (model) =>
            Math.round(averageRating(findStats(stats, model.id))) === tier.stars
        )
        return (
          <section key={tier.stars}>
            <h3>
              {tier.letter}: {tier.label} ({tier.stars || "unrated"})
            </h3>
            {tierModels.length ? (
              <ul>
                {tierModels.map((model) => (
                  <li key={model.id}>
                    <Link href={`/model/${model.id}`}>{model.name}</Link> —{" "}
                    <Score stats={findStats(stats, model.id)} />
                  </li>
                ))}
              </ul>
            ) : (
              <p>No models in this tier.</p>
            )}
          </section>
        )
      })}
    </>
  )
}

function ModelResults({
  entries,
  stats,
  view,
}: {
  entries: Model[]
  stats?: Stats[]
  view: View
}) {
  if (!entries.length) return <p>No models found. Try different filters.</p>
  if (view === "tier") return <TierList entries={entries} stats={stats} />
  return (
    <>
      {entries.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          stats={findStats(stats, model.id)}
        />
      ))}
    </>
  )
}

export function Catalog({
  models,
  browse = false,
}: {
  models: Model[]
  browse?: boolean
}) {
  const stats = useQuery(api.ratings.community)
  const [view, setView] = useState<View>(browse ? "grid" : "tier")
  const [filters, setFilters] = useState<Filters>({
    search: "",
    provider: "All providers",
    openOnly: false,
    sort: "rating",
  })
  const entries = filterAndSortModels(models, filters, stats)
  const voteCount = stats?.reduce((total, entry) => total + entry.count, 0)

  return (
    <main>
      <CatalogIntro
        browse={browse}
        modelCount={models.length}
        voteCount={voteCount}
      />
      {!browse && (
        <section>
          <h2>Featured models</h2>
          {models
            .filter((model) => model.featured)
            .map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                stats={findStats(stats, model.id)}
              />
            ))}
        </section>
      )}
      <section>
        <h2>{browse ? "All models" : "Community rankings"}</h2>
        <CatalogFilters
          models={models}
          filters={filters}
          setFilters={setFilters}
        />
        <p>
          View:{" "}
          <button
            type="button"
            disabled={view === "tier"}
            onClick={() => setView("tier")}
          >
            Tier list
          </button>{" "}
          <button
            type="button"
            disabled={view === "grid"}
            onClick={() => setView("grid")}
          >
            List
          </button>
        </p>
        {stats === undefined && <p role="status">Loading ratings…</p>}
        <ModelResults entries={entries} stats={stats} view={view} />
      </section>
    </main>
  )
}
