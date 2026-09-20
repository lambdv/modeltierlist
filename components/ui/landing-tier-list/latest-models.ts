import type { Model } from "@/lib/models"

export function latestFromEachProvider(models: Model[]) {
  const oneYearAgo = Math.floor(Date.now() / 1000) - 365 * 24 * 60 * 60
  const groups = new Map<string, Model[]>()
  for (const model of models) {
    if (model.createdAt < oneYearAgo) continue
    const group = groups.get(model.provider) ?? []
    group.push(model)
    groups.set(model.provider, group)
  }
  return [...groups.values()].flatMap((group) =>
    group.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
  )
}
