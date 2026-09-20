import { Catalog } from "@/components/ui/catalog/catalog"
import { getAllModels } from "@/lib/openrouter"

export default async function ModelsPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string | string[] }>
}) {
  const { provider } = await searchParams
  const models = await getAllModels()
  const initialProvider =
    typeof provider === "string" &&
    models.some((model) => model.provider === provider)
      ? provider
      : ""
  return (
    <Catalog
      key={initialProvider}
      models={models}
      initialProvider={initialProvider}
    />
  )
}
