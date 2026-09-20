import { notFound } from "next/navigation"
import { getAllModels, getModels } from "@/lib/openrouter"
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
  const [allModels, models] = await Promise.all([getAllModels(), getModels()])
  const model = allModels.find((entry) => entry.id === modelId)
  if (!model) notFound()
  return (
    <ModelDetail model={model} modelIds={models.map((entry) => entry.id)} />
  )
}
