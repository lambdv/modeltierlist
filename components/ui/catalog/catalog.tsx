"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { isDefaultModel, isLanguageModel, type Model } from "@/lib/models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getRankings } from "@/lib/model-rankings"
import { ModelLabel } from "@/components/ui/model-ui/model-ui"
import { BorderGlow } from "@/components/ui/border-glow/border-glow"
import styles from "./catalog.module.css"

export function Catalog({
  models,
}: {
  models: Model[]
  initialProvider?: string
}) {
  const stats = useQuery(api.ratings.community)
  const [search, setSearch] = useState("")
  // Provider, capability, sorting, and scope controls are intentionally
  // disabled while the catalog uses a search-only browsing experience.
  const rankings = getRankings(
    models.map((model) => model.id),
    stats
  )
  const scopedModels = models.filter((model) => {
    if (!isLanguageModel(model) || model.variant !== "standard") return false
    if (!model.canonical) return false
    return isDefaultModel(model)
  })
  const query = search.trim().toLowerCase()
  const entries = scopedModels
    .filter(
      (model) =>
        !query ||
        `${model.name} ${model.id} ${model.provider} ${model.tags.join(" ")}`
          .toLowerCase()
          .includes(query)
    )
    .sort((a, b) => {
      return (
        (rankings.overall.get(a.id) ?? Infinity) -
          (rankings.overall.get(b.id) ?? Infinity) ||
        a.name.localeCompare(b.name)
      )
    })
  const filtered = Boolean(search)

  function clearFilters() {
    setSearch("")
  }

  return (
    <main className={styles.page}>
      <header className="ranking-header">
        <div className="ranking-title-row">
          <h1>Models</h1>
        </div>
      </header>

      <section aria-label="Find models" className={styles.filters}>
        <Input
          aria-label="Search models"
          type="search"
          placeholder="Search models"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        {/* Additional filters are intentionally disabled for now. */}
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
              className={styles.cardLink}
            >
              <BorderGlow contentClassName={styles.card}>
                <h2 className="min-w-0 truncate text-sm font-medium">
                  <ModelLabel model={model} />
                </h2>
                <span
                  className="shrink-0 text-xs text-muted-foreground tabular-nums"
                  aria-label={rank ? `Rank ${rank}` : "Unranked"}
                >
                  {stats === undefined ? "…" : rank ? `#${rank}` : "—"}
                </span>
              </BorderGlow>
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
