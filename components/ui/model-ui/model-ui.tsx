"use client"

import Link from "next/link"
import { modelDisplayName, type Model } from "@/lib/models"
import { getProviderIcon } from "@/lib/provider-icons"
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
  const { icon, src } = getProviderIcon(id)
  return (
    <span
      className="relative inline-flex size-[1.4em] shrink-0 items-center justify-center"
      title={provider}
    >
      {src ? (
        // Curated local marks avoid runtime requests and layout changes.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${provider} logo`}
          className="size-full dark:invert"
        />
      ) : icon ? (
        <svg viewBox="0 0 24 24" role="img" aria-label={`${provider} logo`}>
          <path d={icon.path} fill="currentColor" />
        </svg>
      ) : (
        <span aria-hidden="true" className="text-[0.7em]">
          {fallback}
        </span>
      )}
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

export function ModelLabel({
  model,
  className,
}: {
  model: Pick<Model, "id" | "name" | "provider" | "symbol">
  className?: string
}) {
  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className ?? ""}`}>
      <ProviderIcon
        id={model.id}
        provider={model.provider}
        fallback={model.symbol}
      />
      <span className="min-w-0 truncate">{modelDisplayName(model)}</span>
    </span>
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
        <Link href={`/models/${encodeURIComponent(model.id)}`}>
          <ModelLabel model={model} />
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
