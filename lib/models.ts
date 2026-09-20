export type Model = {
  id: string
  name: string
  provider: string
  family: string
  color: string
  symbol: string
  tags: string[]
  description: string
  status: string
  access: string
  featured: boolean
  createdAt: number
  category: "general" | "reasoning" | "coding" | "image" | "audio" | "other"
  lifecycle: "current" | "preview" | "legacy" | "deprecated"
  variant: "standard" | "batch" | "free" | "alias" | "specialized"
  canonicalModelId?: string
  canonical: boolean
  curated: boolean
}

export function modelDisplayName(model: Pick<Model, "name" | "provider">) {
  const prefix = `${model.provider}:`
  return model.name.toLowerCase().startsWith(prefix.toLowerCase())
    ? model.name.slice(prefix.length).trimStart()
    : model.name
}

export function isLanguageModel(model: Model) {
  return ["general", "reasoning", "coding"].includes(model.category)
}

export function isDefaultModel(model: Model) {
  return (
    isLanguageModel(model) &&
    model.variant === "standard" &&
    model.canonical &&
    model.curated &&
    ["current", "preview"].includes(model.lifecycle)
  )
}

export const tiers = [
  { stars: 5, letter: "S", label: "Exceptional", color: "mint" },
  { stars: 4, letter: "A", label: "Excellent", color: "blue" },
  { stars: 3, letter: "B", label: "Solid", color: "purple" },
  { stars: 2, letter: "C", label: "Mixed", color: "yellow" },
  { stars: 1, letter: "D", label: "Underwhelming", color: "peach" },
] as const
