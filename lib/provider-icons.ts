import {
  siAnthropic,
  siDeepseek,
  siGoogle,
  siMeta,
  siMistralai,
  siNvidia,
  siPerplexity,
  type SimpleIcon,
} from "simple-icons"

// Keep provider branding independent from model records. Add curated local SVGs
// here as providers without a Simple Icons entry are collected.
export const providerIcons: Record<string, SimpleIcon> = {
  anthropic: siAnthropic,
  deepseek: siDeepseek,
  google: siGoogle,
  meta: siMeta,
  "meta-llama": siMeta,
  mistral: siMistralai,
  mistralai: siMistralai,
  nvidia: siNvidia,
  perplexity: siPerplexity,
}

export const localProviderIcons: Record<string, string> = {
  openai: "/providers/openai.svg",
}

export function getProviderIcon(modelId: string) {
  const providerId = modelId.split("/")[0].replace(/^~/, "").toLowerCase()
  return {
    icon: providerIcons[providerId],
    src: localProviderIcons[providerId],
  }
}
