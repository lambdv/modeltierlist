import { PersonalList } from "@/components/personal-list"
import { getModels } from "@/lib/openrouter"

export default async function MyListPage() {
  const models = await getModels()
  return <PersonalList models={models} />
}
