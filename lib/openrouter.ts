import "server-only"
import { type Model } from "@/lib/models"

type OpenRouterModel = {
  id: string
  canonical_slug?: string
  name: string
  description?: string
  context_length?: number | null
  hugging_face_id?: string | null
  architecture?: { input_modalities?: string[] }
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

function toModel(model: OpenRouterModel, index: number): Model {
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
    description: model.description || "No description is available from OpenRouter.",
    status: model.context_length
      ? `${model.context_length.toLocaleString()} token context`
      : "Available on OpenRouter",
    access: model.hugging_face_id ? "Open weights" : "Proprietary",
    featured: index < 4,
    createdAt: model.created ?? 0,
  }
}

export async function getModels(): Promise<Model[]> {
  const headers: HeadersInit = { Accept: "application/json" }
  const apiKey = process.env.OPENROUTER_API_KEY?.trim()
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`

  const response = await fetch("https://openrouter.ai/api/v1/models?limit=1000", {
    headers,
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error(`OpenRouter models request failed (${response.status})`)
  }

  const payload = (await response.json()) as OpenRouterModelsResponse
  return payload.data.map(exactModel).map(toModel)
}
