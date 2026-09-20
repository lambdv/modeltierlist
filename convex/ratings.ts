import { v, ConvexError } from "convex/values"
import { mutation, query } from "./_generated/server"
import { authComponent } from "./auth"

export const community = query({
  args: {},
  handler: async (ctx) => ctx.db.query("modelStats").collect(),
})

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx)
    if (!user) return []
    return ctx.db
      .query("ratings")
      .withIndex("by_user_model", (q) => q.eq("userId", user._id))
      .collect()
  },
})

export const rate = mutation({
  args: {
    modelId: v.string(),
    stars: v.union(
      v.literal(1),
      v.literal(2),
      v.literal(3),
      v.literal(4),
      v.literal(5),
      v.null()
    ),
  },
  handler: async (ctx, { modelId, stars }) => {
    const user = await authComponent.getAuthUser(ctx)
    if (modelId.length > 200 || !/^[a-z0-9._-]+\/[a-z0-9._:-]+$/i.test(modelId))
      throw new ConvexError("Invalid OpenRouter model ID")
    const previous = await ctx.db
      .query("ratings")
      .withIndex("by_user_model", (q) =>
        q.eq("userId", user._id).eq("modelId", modelId)
      )
      .unique()
    const stats = await ctx.db
      .query("modelStats")
      .withIndex("by_model", (q) => q.eq("modelId", modelId))
      .unique()
    const distribution = [...(stats?.distribution ?? [0, 0, 0, 0, 0])]
    if (previous) distribution[previous.stars - 1]--
    if (stars !== null) distribution[stars - 1]++
    const next = {
      modelId,
      count:
        (stats?.count ?? 0) + (stars === null ? 0 : 1) - (previous ? 1 : 0),
      total: (stats?.total ?? 0) + (stars ?? 0) - (previous?.stars ?? 0),
      distribution,
    }
    if (stats) await ctx.db.patch(stats._id, next)
    else if (stars !== null) await ctx.db.insert("modelStats", next)
    if (stars === null) {
      if (previous) await ctx.db.delete(previous._id)
    } else if (previous) {
      await ctx.db.patch(previous._id, { stars, updatedAt: Date.now() })
    } else {
      await ctx.db.insert("ratings", {
        userId: user._id,
        modelId,
        stars,
        updatedAt: Date.now(),
      })
    }
  },
})
