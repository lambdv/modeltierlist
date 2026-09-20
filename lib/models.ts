export type Model = {
  id: string
  name: string
  provider: string
  family: string
  color: string
  symbol: string
  tags: string[]
  description: string
  status: string
  access: string
  featured: boolean
}

export const tiers = [
  { stars: 5, letter: "S", label: "Exceptional", color: "mint" },
  { stars: 4, letter: "A", label: "Excellent", color: "blue" },
  { stars: 3, letter: "B", label: "Solid", color: "purple" },
  { stars: 2, letter: "C", label: "Mixed", color: "yellow" },
  { stars: 1, letter: "D", label: "Underwhelming", color: "peach" },
] as const
