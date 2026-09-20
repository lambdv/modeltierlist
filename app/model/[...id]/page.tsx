import { notFound } from "next/navigation"
import { getModels } from "@/lib/openrouter"
import { ModelDetail } from "@/components/model-detail"

export default async function ModelPage({
  params,
}: {
  params: Promise<{ id: string[] }>
}) {
  const { id } = await params
  const modelId = id.join("/")
  const models = await getModels()
  const model = models.find((entry) => entry.id === modelId)
  if (!model) notFound()
  return <ModelDetail model={model} />
}
