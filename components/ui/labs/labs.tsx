"use client"

import { useState } from "react"
import Link from "next/link"
import { type Lab } from "@/lib/labs"
import { Input } from "@/components/ui/input"
import { ProviderIcon } from "@/components/ui/model-ui/model-ui"
import { BorderGlow } from "@/components/ui/border-glow/border-glow"
import styles from "./labs.module.css"

export function Labs({ labs }: { labs: Lab[] }) {
  const [search, setSearch] = useState("")
  const query = search.trim().toLowerCase()
  const entries = labs.filter((lab) =>
    `${lab.name} ${lab.models.map((model) => model.name).join(" ")}`
      .toLowerCase()
      .includes(query)
  )

  return (
    <main className={styles.page}>
      <header className="ranking-header">
        <div className="ranking-title-row">
          <h1>Labs</h1>
        </div>
      </header>
      <Input
        aria-label="Search labs"
        type="search"
        placeholder="Search labs"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className={styles.search}
      />
      <section className={styles.grid} aria-label="Labs">
        {entries.map((lab) => (
          <Link
            key={lab.id}
            href={`/labs/${lab.id}`}
            className={styles.labCardLink}
          >
            <BorderGlow contentClassName={styles.labCard}>
              <div className={styles.labName}>
                <ProviderIcon id={`${lab.id}/model`} provider={lab.name} />
                <h2>{lab.name}</h2>
              </div>
              <div className={styles.labMeta}>
                <span>{lab.models.length} models</span>
              </div>
            </BorderGlow>
          </Link>
        ))}
      </section>
      {!entries.length && <p className={styles.empty}>No labs found</p>}
    </main>
  )
}
