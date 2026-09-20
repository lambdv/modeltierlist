"use client"

import Link from "next/link"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { type Lab } from "@/lib/labs"
import { getRankings } from "@/lib/model-rankings"
import { ProviderIcon } from "@/components/ui/model-ui/model-ui"
import styles from "./labs.module.css"

export function Labs({ labs }: { labs: Lab[] }) {
  const stats = useQuery(api.ratings.community)
  const rankings = getRankings(
    labs.flatMap((lab) => lab.models.map((model) => model.id)),
    stats
  )

  return (
    <main className={styles.page}>
      <div className={styles.intro}>
        <h1>Labs</h1>
        <p>Explore the teams building the models on Modelist.</p>
      </div>
      <section className={styles.grid} aria-label="Labs">
        {labs.map((lab) => {
          const bestRank = Math.min(
            ...lab.models.map(
              (model) => rankings.overall.get(model.id) ?? Infinity
            )
          )
          return (
            <Link key={lab.id} href={`/labs/${lab.id}`} className={styles.labCard}>
              <div className={styles.labName}>
                <ProviderIcon
                  id={`${lab.id}/model`}
                  provider={lab.name}
                />
                <h2>{lab.name}</h2>
              </div>
              <div className={styles.labMeta}>
                <span>{lab.models.length} models</span>
                <span>
                  {stats === undefined
                    ? "Loading rank…"
                    : Number.isFinite(bestRank)
                      ? `Best rank #${bestRank}`
                      : "Not yet ranked"}
                </span>
              </div>
            </Link>
          )
        })}
      </section>
    </main>
  )
}
