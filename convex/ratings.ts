import { v, ConvexError } from "convex/values"
import { internalMutation, mutation, query } from "./_generated/server"
import { authComponent } from "./auth"
import { isValidModelId } from "../lib/model-id"

export const profile = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const viewer = await authComponent.safeGetAuthUser(ctx)
    const user = await authComponent
      .getAnyUserById(ctx, userId)
      .catch((error: unknown) => {
        if (
          error instanceof Error &&
          /Unable to decode ID|Invalid argument `id`/.test(error.message)
        )
          return null
        throw error
      })
    if (!user) return null
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_user_model", (q) => q.eq("userId", userId))
      .collect()
    return {
      user: { id: user._id, name: user.name, image: user.image ?? null },
      ratings: ratings.map(({ modelId, stars, notes }) => ({
        modelId,
        stars,
        notes: viewer?._id === userId ? (notes ?? "") : "",
      })),
    }
  },
})

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
    notes: v.optional(v.string()),
  },
  handler: async (ctx, { modelId, stars, notes }) => {
    const user = await authComponent.getAuthUser(ctx)
    // Legacy ratings can contain IDs that no longer pass validation. Always
    // allow their removal, but never create a new rating with an invalid ID.
    if (stars !== null && !isValidModelId(modelId))
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
      await ctx.db.patch(previous._id, {
        stars,
        notes: notes?.trim() || undefined,
        updatedAt: Date.now(),
      })
    } else {
      await ctx.db.insert("ratings", {
        userId: user._id,
        modelId,
        stars,
        notes: notes?.trim() || undefined,
        updatedAt: Date.now(),
      })
    }
  },
})

// Maintenance function for removing an account's ratings without leaving the
// aggregate community statistics out of sync. Internal functions cannot be
// called by clients.
export const clearUserRatings = internalMutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_user_model", (q) => q.eq("userId", userId))
      .collect()

    for (const rating of ratings) {
      const stats = await ctx.db
        .query("modelStats")
        .withIndex("by_model", (q) => q.eq("modelId", rating.modelId))
        .unique()

      if (stats) {
        const count = Math.max(0, stats.count - 1)
        if (count === 0) {
          await ctx.db.delete(stats._id)
        } else {
          const distribution = [...stats.distribution]
          distribution[rating.stars - 1] = Math.max(
            0,
            (distribution[rating.stars - 1] ?? 0) - 1
          )
          await ctx.db.patch(stats._id, {
            count,
            total: Math.max(0, stats.total - rating.stars),
            distribution,
          })
        }
      }

      await ctx.db.delete(rating._id)
    }

    return { deleted: ratings.length }
  },
})
