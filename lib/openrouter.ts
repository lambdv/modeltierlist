import "server-only"
import { isDefaultModel, type Model } from "@/lib/models"

type OpenRouterModel = {
  id: string
  canonical_slug?: string
  name: string
  description?: string
  context_length?: number | null
  hugging_face_id?: string | null
  architecture?: { input_modalities?: string[]; output_modalities?: string[] }
  supported_parameters?: string[]
  created?: number
}

type OpenRouterModelsResponse = { data: OpenRouterModel[] }

const providerNames: Record<string, string> = {
  anthropic: "Anthropic",
  google: "Google",
  meta: "Meta",
  mistralai: "Mistral AI",
  openai: "OpenAI",
  qwen: "Qwen",
}

function formatProvider(id: string) {
  // OpenRouter also publishes alias providers prefixed with "~".
  const provider = id.split("/")[0].replace(/^~/, "")
  return (
    providerNames[provider] ??
    provider
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  )
}

function exactModel(model: OpenRouterModel): OpenRouterModel {
  if (!/latest/i.test(model.id) && !/latest/i.test(model.name)) return model

  const canonicalId = model.canonical_slug
  // Alias pointers (e.g. "~provider/model-latest") whose canonical slug is
  // still a "latest" pointer have no pinned version to resolve to. They are
  // real, routable models that users can rate, so keep them as published
  // instead of dropping them (dropping orphans existing ratings: the model
  // disappears from the catalog, leaderboards, and its detail page 404s,
  // leaving the rating visible only as an unremovable ghost entry).
  if (!canonicalId || /latest$/i.test(canonicalId)) return model

  const version = canonicalId.slice(model.id.length).replace(/^-/, "")
  const formattedVersion = /^\d{8}$/.test(version)
    ? `${version.slice(0, 4)}-${version.slice(4, 6)}-${version.slice(6)}`
    : version

  return {
    ...model,
    id: canonicalId,
    name: model.name.replace(/\s+Latest\b/i, ` ${formattedVersion}`),
  }
}

function variantOf(model: OpenRouterModel): Model["variant"] {
  const value = `${model.id} ${model.name}`.toLowerCase()
  if (/\bbatch\b|:batch\b/.test(value)) return "batch"
  if (/\bfree\b|:free\b/.test(value)) return "free"
  if (/\blatest\b|-latest\b/.test(value)) return "alias"
  if (/custom[ -]?tools|\bcontributor\b/.test(value)) return "specialized"
  return "standard"
}

function categoryOf(model: OpenRouterModel): Model["category"] {
  const value = `${model.id} ${model.name}`.toLowerCase()
  const outputs = model.architecture?.output_modalities ?? []
  if (outputs.includes("image") || /image|nano.?banana/.test(value))
    return "image"
  if (
    outputs.some((item) => ["audio", "music"].includes(item)) ||
    /audio|lyria|voxtral/.test(value)
  )
    return "audio"
  if (
    /moderation|safety|guard|safeguard|router|body.builder|fusion|pareto/.test(
      value
    )
  )
    return "other"
  if (/coder|codestral|codex|code\b|devstral|apply|schematron/.test(value))
    return "coding"
  if (/reasoning|thinking|\br1\b|\bo[134](?:-|\s|$)/.test(value))
    return "reasoning"
  return "general"
}

function lifecycleOf(model: OpenRouterModel): Model["lifecycle"] {
  const value = `${model.id} ${model.name}`.toLowerCase()
  if (/deprecated/.test(value)) return "deprecated"
  if (/preview|\bexp\b|experimental|\balpha\b|\bbeta\b/.test(value))
    return "preview"
  const twoYearsAgo = Math.floor(Date.now() / 1000) - 2 * 365 * 24 * 60 * 60
  return model.created && model.created < twoYearsAgo ? "legacy" : "current"
}

function familyKey(model: OpenRouterModel) {
  const provider = model.id.split("/")[0].replace(/^~/, "")
  return `${provider}/${model.name
    .toLowerCase()
    .replace(/^.*?:\s*/, "")
    .replace(/\s*\((?:batch|free)\)\s*/g, " ")
    .replace(/\b(?:preview|experimental|exp|latest)\b/g, " ")
    .replace(/\b(?:19|20)\d{2}[-/]?\d{2}(?:[-/]?\d{2})?\b/g, " ")
    .replace(/\b\d{4}\b$/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`
}

const providerLimit: Record<string, number> = {
  anthropic: 6,
  deepseek: 5,
  google: 8,
  meta: 4,
  mistralai: 5,
  openai: 10,
  qwen: 6,
}

function toModel(
  model: OpenRouterModel,
  index: number,
  canonical = true
): Model {
  const provider = formatProvider(model.id)
  const tags = new Set<string>()
  const modalities = model.architecture?.input_modalities ?? []
  if (modalities.some((modality) => modality !== "text")) tags.add("Multimodal")
  if (model.supported_parameters?.includes("reasoning")) tags.add("Reasoning")
  if (model.hugging_face_id) tags.add("Open weights")
  if (!tags.size) tags.add("Text generation")

  return {
    id: model.id,
    name: model.name,
    provider,
    family: provider,
    color: "neutral",
    symbol: "◈",
    tags: [...tags],
    description:
      model.description || "No description is available from OpenRouter.",
    status: model.context_length
      ? `${model.context_length.toLocaleString()} token context`
      : "Available on OpenRouter",
    access: model.hugging_face_id ? "Open weights" : "Proprietary",
    featured: index < 4,
    createdAt: model.created ?? 0,
    category: categoryOf(model),
    lifecycle: lifecycleOf(model),
    variant: variantOf(model),
    canonicalModelId: model.canonical_slug,
    canonical,
    curated: false,
  }
}

export async function getAllModels(): Promise<Model[]> {
  const headers: HeadersInit = { Accept: "application/json" }
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  const response = await fetch(
    "https://openrouter.ai/api/v1/models?limit=1000",
    {
      headers,
      next: { revalidate: 3600 },
    }
  )

  if (!response.ok) {
    throw new Error(`OpenRouter models request failed (${response.status})`)
  }

  const payload = (await response.json()) as OpenRouterModelsResponse
  const newestByFamily = new Map<string, OpenRouterModel>()
  for (const model of payload.data) {
    if (variantOf(model) !== "standard") continue
    const key = familyKey(model)
    const current = newestByFamily.get(key)
    if (!current || (model.created ?? 0) > (current.created ?? 0))
      newestByFamily.set(key, model)
  }

  const seen = new Set<string>()
  const models = payload.data.flatMap((raw, index) => {
    const exact = exactModel(raw)
    if (seen.has(exact.id)) return []
    seen.add(exact.id)
    return [toModel(exact, index, newestByFamily.get(familyKey(raw)) === raw)]
  })

  const candidates = models
    .filter(
      (model) =>
        model.canonical &&
        model.variant === "standard" &&
        ["general", "reasoning", "coding"].includes(model.category) &&
        ["current", "preview"].includes(model.lifecycle)
    )
    .sort((a, b) => b.createdAt - a.createdAt || a.name.localeCompare(b.name))
  const selected = new Set<string>()
  const counts = new Map<string, number>()
  for (const model of candidates) {
    const providerId = model.id.split("/")[0].replace(/^~/, "")
    const count = counts.get(providerId) ?? 0
    if (count >= (providerLimit[providerId] ?? 1)) continue
    selected.add(model.id)
    counts.set(providerId, count + 1)
  }

  return models.map((model) => ({
    ...model,
    curated: selected.has(model.id),
  }))
}

export async function getModels(): Promise<Model[]> {
  return (await getAllModels()).filter(isDefaultModel)
}
