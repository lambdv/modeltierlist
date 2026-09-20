import { notFound } from "next/navigation"
import { getModels } from "@/lib/openrouter"
import { ModelDetail } from "@/components/ui/model-detail/model-detail"

export default async function ModelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let modelId: string
  try {
    modelId = decodeURIComponent(id)
  } catch {
    notFound()
  }
  const models = await getModels()
  const model = models.find((entry) => entry.id === modelId)
  if (!model) notFound()
  return (
    <ModelDetail model={model} modelIds={models.map((entry) => entry.id)} />
  )
}
