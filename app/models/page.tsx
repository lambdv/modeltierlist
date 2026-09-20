import { Catalog } from "@/components/catalog"
import { getModels } from "@/lib/openrouter"

export default async function ModelsPage() {
  const models = await getModels()
  return <Catalog models={models} browse />
}
