import { LandingTierList } from "@/components/ui/landing-tier-list/landing-tier-list"
import { getModels } from "@/lib/openrouter"

export default async function Page() {
  const models = await getModels()
  return <LandingTierList models={models} />
}
