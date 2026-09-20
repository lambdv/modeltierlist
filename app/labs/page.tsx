import { Labs } from "@/components/ui/labs/labs"
import { getLabs } from "@/lib/labs"
import { getAllModels } from "@/lib/openrouter"

export default async function LabsPage() {
  return <Labs labs={getLabs(await getAllModels())} />
}
