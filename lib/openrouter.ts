import "server-only"
import { type Model } from "@/lib/models"

type OpenRouterModel = {
  id: string
  name: string
  description?: string
  context_length?: number | null
  hugging_face_id?: string | null
  architecture?: { input_modalities?: string[] }
  supported_parameters?: string[]
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
  const provider = id.split("/")[0]
  return (
    providerNames[provider] ??
    provider
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  )
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
  return payload.data.map(toModel)
}
