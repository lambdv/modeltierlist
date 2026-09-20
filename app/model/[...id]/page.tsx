import { permanentRedirect } from "next/navigation"

export default async function ModelPage({
  params,
}: {
  params: Promise<{ id: string[] }>
}) {
  const { id } = await params
  permanentRedirect(`/models/${encodeURIComponent(id.join("/"))}`)
}
