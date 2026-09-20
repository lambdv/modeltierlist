import { notFound } from "next/navigation"
import { LabDetail } from "@/components/ui/labs/lab-detail"
import { getLabs, labModels } from "@/lib/labs"
import { getAllModels } from "@/lib/openrouter"

export default async function LabPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const models = await getAllModels()
  const lab = getLabs(models).find((entry) => entry.id === id.toLowerCase())
  if (!lab) notFound()
  return (
    <LabDetail
      lab={lab}
      allModels={labModels(models).map(({ id, createdAt }) => ({ id, createdAt }))}
    />
  )
}
