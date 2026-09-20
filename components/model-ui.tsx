"use client"

import Link from "next/link"
import { type Model } from "@/lib/models"

export type Stats = {
  modelId: string
  count: number
  total: number
  distribution: number[]
}

export function averageRating(stats?: Stats) {
  return stats?.count ? stats.total / stats.count : 0
}

export function ModelIcon({ model }: { model: Model; small?: boolean }) {
  return <span aria-hidden="true">{model.symbol}</span>
}

export function Score({ stats }: { stats?: Stats }) {
  if (!stats?.count) return <span>Not rated</span>
  return (
    <span>
      {averageRating(stats).toFixed(1)} / 5 ({stats.count})
    </span>
  )
}

export function ModelCard({ model, stats }: { model: Model; stats?: Stats }) {
  return (
    <article>
      <h3>
        <ModelIcon model={model} />{" "}
        <Link href={`/model/${model.id}`}>{model.name}</Link>
      </h3>
      <p>{model.provider}</p>
      <p>{model.tags.join(", ")}</p>
      <Score stats={stats} />
    </article>
  )
}

export function StarRating({
  value,
  onChange,
  disabled = false,
}: {
  value: number
  onChange: (value: 1 | 2 | 3 | 4 | 5) => void
  disabled?: boolean
}) {
  return (
    <fieldset disabled={disabled}>
      <legend>Rating</legend>
      {([1, 2, 3, 4, 5] as const).map((stars) => (
        <label key={stars}>
          <input
            type="radio"
            name="rating"
            checked={value === stars}
            onChange={() => onChange(stars)}
          />
          {stars} {stars === 1 ? "star" : "stars"}
        </label>
      ))}
    </fieldset>
  )
}
