"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { isDefaultModel, isLanguageModel, type Model } from "@/lib/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { getRankings } from "@/lib/model-rankings"
import { ModelLabel } from "@/components/ui/model-ui/model-ui"
import styles from "./catalog.module.css"

export function Catalog({
  models,
  initialProvider = "",
}: {
  models: Model[]
  initialProvider?: string
}) {
  const stats = useQuery(api.ratings.community)
  const [search, setSearch] = useState("")
  const [provider, setProvider] = useState(initialProvider)
  const [capability, setCapability] = useState("")
  const [sort, setSort] = useState("rank")
  const [scope, setScope] = useState("current")
  const rankings = getRankings(
    models.map((model) => model.id),
    stats
  )
  const scopedModels = models.filter((model) => {
    if (!isLanguageModel(model) || model.variant !== "standard") return false
    if (scope === "versions") return true
    if (!model.canonical) return false
    return scope === "legacy" || isDefaultModel(model)
  })
  const providers = [
    ...new Set(scopedModels.map((model) => model.provider)),
  ].sort()
  const capabilities = [
    ...new Set(scopedModels.flatMap((model) => model.tags)),
  ].sort()
  const query = search.trim().toLowerCase()
  const entries = scopedModels
    .filter(
      (model) =>
        (!query ||
          `${model.name} ${model.id} ${model.provider} ${model.tags.join(" ")}`
            .toLowerCase()
            .includes(query)) &&
        (!provider || model.provider === provider) &&
        (!capability || model.tags.includes(capability))
    )
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name)
      if (sort === "newest")
        return b.createdAt - a.createdAt || a.name.localeCompare(b.name)
      const ranks = sort === "popular" ? rankings.popularity : rankings.overall
      return (
        (ranks.get(a.id) ?? Infinity) - (ranks.get(b.id) ?? Infinity) ||
        a.name.localeCompare(b.name)
      )
    })
  const filtered = Boolean(
    search || provider || capability || scope !== "current"
  )

  function clearFilters() {
    setSearch("")
    setProvider("")
    setCapability("")
    setScope("current")
  }

  return (
    <main className={styles.page}>
      <h1 className="mb-6 text-xl font-semibold">Models</h1>

      <section aria-label="Find models" className={styles.filters}>
        <Input
          aria-label="Search models"
          type="search"
          placeholder="Search models"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <div className={styles.filterRow}>
          <label>
            Provider
            <NativeSelect
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
            >
              <NativeSelectOption value="">All providers</NativeSelectOption>
              {providers.map((name) => (
                <NativeSelectOption key={name}>{name}</NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label>
            Capability
            <NativeSelect
              value={capability}
              onChange={(event) => setCapability(event.target.value)}
            >
              <NativeSelectOption value="">All capabilities</NativeSelectOption>
              {capabilities.map((name) => (
                <NativeSelectOption key={name}>{name}</NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label className={styles.sort}>
            Sort by
            <NativeSelect
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <NativeSelectOption value="rank">Overall rank</NativeSelectOption>
              <NativeSelectOption value="popular">
                Most popular
              </NativeSelectOption>
              <NativeSelectOption value="newest">
                Newest first
              </NativeSelectOption>
              <NativeSelectOption value="name">Name A–Z</NativeSelectOption>
            </NativeSelect>
          </label>
          <label>
            Scope
            <NativeSelect
              value={scope}
              onChange={(event) => setScope(event.target.value)}
            >
              <NativeSelectOption value="current">
                Current models
              </NativeSelectOption>
              <NativeSelectOption value="legacy">
                Include legacy
              </NativeSelectOption>
              <NativeSelectOption value="versions">
                All LLM versions
              </NativeSelectOption>
            </NativeSelect>
          </label>
        </div>
      </section>

      <div className={styles.resultsHeading}>
        <p role="status">
          <strong>{entries.length.toLocaleString()}</strong>{" "}
          {filtered
            ? `of ${scopedModels.length.toLocaleString()} models`
            : "models"}
        </p>
        {filtered ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X size={13} /> Clear filters
          </Button>
        ) : null}
      </div>
      {stats === undefined && (
        <p className={styles.loading} role="status">
          Loading rankings…
        </p>
      )}
      <section aria-label="Models" className={styles.list}>
        {entries.map((model) => {
          const rank = rankings.overall.get(model.id)
          return (
            <Link
              key={model.id}
              href={`/models/${encodeURIComponent(model.id)}`}
              className={styles.card}
            >
              <h2 className="min-w-0 truncate text-sm font-medium">
                <ModelLabel model={model} />
              </h2>
              <span
                className="shrink-0 text-xs text-muted-foreground tabular-nums"
                aria-label={rank ? `Rank ${rank}` : "Unranked"}
              >
                {stats === undefined ? "…" : rank ? `#${rank}` : "—"}
              </span>
            </Link>
          )
        })}
      </section>
      {!entries.length && (
        <div className={styles.empty}>
          <h2>No models found</h2>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}
    </main>
  )
}
