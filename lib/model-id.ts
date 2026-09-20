// OpenRouter also publishes alias providers prefixed with "~".
export function isValidModelId(modelId: string) {
  return (
    modelId.length <= 200 && /^~?[a-z0-9._-]+\/[a-z0-9._:-]+$/i.test(modelId)
  )
}
