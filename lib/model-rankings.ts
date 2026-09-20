type RatingStats = { modelId: string; count: number; total: number }

// Competition ranks: equal scores share a rank, and unrated models have none.
export function getRankings(modelIds: string[], stats?: RatingStats[]) {
  const ids = new Set(modelIds)
  const rated = (stats ?? []).filter(
    (entry) => ids.has(entry.modelId) && entry.count > 0
  )
  function rankBy(score: (entry: RatingStats) => number) {
    const sorted = [...rated].sort((a, b) => score(b) - score(a))
    const ranks = new Map<string, number>()
    let rank = 0
    sorted.forEach((entry, index) => {
      if (!index || score(entry) !== score(sorted[index - 1])) rank = index + 1
      ranks.set(entry.modelId, rank)
    })
    return ranks
  }
  return {
    overall: rankBy((entry) => entry.total / entry.count),
    popularity: rankBy((entry) => entry.count),
  }
}
