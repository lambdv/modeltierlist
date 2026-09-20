import { Profile } from "@/components/ui/profile/profile"
import { getModels } from "@/lib/openrouter"

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params
  const models = await getModels()
  return <Profile userId={userId} models={models} />
}
