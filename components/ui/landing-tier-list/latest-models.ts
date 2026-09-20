import type { Model } from "@/lib/models"

export function latestFromEachProvider(
  models: Model[],
  { since, limit = 5 }: { since?: number; limit?: number } = {}
) {
  const groups = new Map<string, Model[]>()
  for (const model of models) {
    if (since !== undefined && model.createdAt < since) continue
    const group = groups.get(model.provider) ?? []
    group.push(model)
    groups.set(model.provider, group)
  }
  return [...groups.values()].flatMap((group) =>
    group.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit)
  )
}
