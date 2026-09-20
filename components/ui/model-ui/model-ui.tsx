"use client"

import Link from "next/link"
import { type Model } from "@/lib/models"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"

export type Stats = {
  modelId: string
  count: number
  total: number
  distribution: number[]
}

export function averageRating(stats?: Stats) {
  return stats?.count ? stats.total / stats.count : 0
}

export function ProviderIcon({
  id,
  provider,
  fallback = "◈",
}: {
  id: string
  provider: string
  fallback?: string
}) {
  const providerId = id.split("/")[0].replace(/^~/, "")
  return (
    <span
      className="relative inline-flex size-[1em] items-center justify-center"
      title={provider}
    >
      <span aria-hidden="true" className="text-[0.7em]">
        {fallback}
      </span>
      {/* models.dev publishes monochrome provider marks for OpenRouter IDs. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://models.dev/logos/${encodeURIComponent(providerId)}.svg`}
        alt={`${provider} logo`}
        className="absolute inset-0 size-full object-contain opacity-90 invert"
        onError={(event) => {
          event.currentTarget.style.display = "none"
        }}
      />
    </span>
  )
}

export function ModelIcon({ model }: { model: Model; small?: boolean }) {
  return (
    <ProviderIcon
      id={model.id}
      provider={model.provider}
      fallback={model.symbol}
    />
  )
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
        <Link href={`/models/${encodeURIComponent(model.id)}`}>
          {model.name}
        </Link>
      </h3>
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
    <NativeSelect
      aria-label="Your rating"
      value={value}
      disabled={disabled}
      onChange={(event) =>
        onChange(Number(event.target.value) as 1 | 2 | 3 | 4 | 5)
      }
      className="w-full"
    >
      <NativeSelectOption value={0} disabled>
        Choose rating
      </NativeSelectOption>
      {([1, 2, 3, 4, 5] as const).map((stars) => (
        <NativeSelectOption key={stars} value={stars}>
          {stars} {stars === 1 ? "star" : "stars"}
        </NativeSelectOption>
      ))}
    </NativeSelect>
  )
}
