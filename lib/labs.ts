import { isLanguageModel, type Model } from "@/lib/models"

export function labId(model: Pick<Model, "id">) {
  return model.id.split("/")[0].replace(/^~/, "").toLowerCase()
}

export function labModels(models: Model[]) {
  return models.filter(
    (model) => isLanguageModel(model) && model.variant === "standard"
  )
}

export type Lab = {
  id: string
  name: string
  models: Model[]
}

export function getLabs(models: Model[]): Lab[] {
  const labs = new Map<string, Lab>()
  for (const model of labModels(models)) {
    const id = labId(model)
    const lab = labs.get(id) ?? { id, name: model.provider, models: [] }
    lab.models.push(model)
    labs.set(id, lab)
  }
  return [...labs.values()]
    .map((lab) => ({
      ...lab,
      models: lab.models.sort(
        (a, b) => b.createdAt - a.createdAt || a.name.localeCompare(b.name)
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
