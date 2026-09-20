"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Lab } from "@/lib/labs"
import { getRankings } from "@/lib/model-rankings"
import { ModelLabel, ProviderIcon } from "@/components/ui/model-ui/model-ui"
import styles from "./labs.module.css"

function formatDate(timestamp: number) {
  if (!timestamp) return "Unknown"
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

export function LabDetail({
  lab,
  allModels,
}: {
  lab: Lab
  allModels: { id: string; createdAt: number }[]
}) {
  const stats = useQuery(api.ratings.community)
  const current = getRankings(
    allModels.map((model) => model.id),
    stats
  ).overall

  return (
    <main className={styles.page}>
      <Link href="/labs" className={styles.back}>
        <ArrowLeft size={14} /> Labs
      </Link>
      <header className={styles.labHeader}>
        <ProviderIcon id={`${lab.id}/model`} provider={lab.name} />
        <div>
          <h1>{lab.name}</h1>
          <p>{lab.models.length} released models</p>
        </div>
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Model</th>
              <th>Released</th>
              <th title="Retrospective rank using today's ratings among models available on the release date.">
                Rank at release
              </th>
              <th>Current rank</th>
            </tr>
          </thead>
          <tbody>
            {lab.models.map((model) => {
              const availableAtRelease = allModels
                .filter((candidate) => candidate.createdAt <= model.createdAt)
                .map((candidate) => candidate.id)
              // This is a retrospective comparison; historical rating snapshots
              // do not exist for releases that predate Modelist.
              const releaseRank = getRankings(availableAtRelease, stats).overall.get(
                model.id
              )
              const currentRank = current.get(model.id)
              return (
                <tr key={model.id}>
                  <td>
                    <Link href={`/models/${encodeURIComponent(model.id)}`}>
                      <ModelLabel model={model} />
                    </Link>
                  </td>
                  <td>{formatDate(model.createdAt)}</td>
                  <td>{stats === undefined ? "…" : releaseRank ? `#${releaseRank}` : "—"}</td>
                  <td>{stats === undefined ? "…" : currentRank ? `#${currentRank}` : "—"}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className={styles.note}>
        Rank at release is retrospective: it uses today&apos;s ratings against the
        models that were available on that date.
      </p>
    </main>
  )
}
