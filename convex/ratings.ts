import { v, ConvexError } from "convex/values"
import {
  internalMutation,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server"
import { authComponent } from "./auth"
import { isValidModelId } from "../lib/model-id"

const MAX_NOTES_LENGTH = 2_000
const MAX_RATINGS_PER_USER = 2_000
const MAX_PROFILE_RATINGS = MAX_RATINGS_PER_USER
const MAX_COMMUNITY_MODELS = 2_000
const MAX_SEASONAL_RATINGS = 50_000
const MAX_SEASON_AGE_MS = 366 * 24 * 60 * 60 * 1_000
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_REQUESTS = 120

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
      .take(MAX_PROFILE_RATINGS)
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
  handler: async (ctx) => ctx.db.query("modelStats").take(MAX_COMMUNITY_MODELS),
})

export const seasonalCommunity = query({
  args: { since: v.optional(v.number()) },
  handler: async (ctx, { since }) => {
    const now = Date.now()
    const boundedSince =
      since === undefined
        ? now - MAX_SEASON_AGE_MS
        : Math.min(now, Math.max(now - MAX_SEASON_AGE_MS, since))
    const ratings = await ctx.db
      .query("ratings")
      .withIndex("by_updated_at", (q) => q.gte("updatedAt", boundedSince))
      .order("desc")
      .take(MAX_SEASONAL_RATINGS)
    const stats = new Map<
      string,
      { modelId: string; count: number; total: number; distribution: number[] }
    >()

    for (const rating of ratings) {
      const entry = stats.get(rating.modelId) ?? {
        modelId: rating.modelId,
        count: 0,
        total: 0,
        distribution: [0, 0, 0, 0, 0],
      }
      entry.count++
      entry.total += rating.stars
      entry.distribution[rating.stars - 1]++
      stats.set(rating.modelId, entry)
    }

    return [...stats.values()]
  },
})

async function enforceRateLimit(ctx: MutationCtx, userId: string, now: number) {
  const record = await ctx.db
    .query("ratingRateLimits")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .unique()

  if (!record) {
    await ctx.db.insert("ratingRateLimits", {
      userId,
      windowStartedAt: now,
      count: 1,
    })
    return
  }
  if (now - record.windowStartedAt >= RATE_LIMIT_WINDOW_MS) {
    await ctx.db.patch(record._id, { windowStartedAt: now, count: 1 })
    return
  }
  if (record.count >= RATE_LIMIT_REQUESTS)
    throw new ConvexError("Too many rating changes. Please wait a minute.")
  await ctx.db.patch(record._id, { count: record.count + 1 })
}

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
    const now = Date.now()
    await enforceRateLimit(ctx, user._id, now)
    const normalizedNotes = notes?.trim() || undefined
    if (normalizedNotes && normalizedNotes.length > MAX_NOTES_LENGTH)
      throw new ConvexError(
        `Notes must be ${MAX_NOTES_LENGTH} characters or less`
      )
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
    if (!previous && stars !== null) {
      const existingRatings = await ctx.db
        .query("ratings")
        .withIndex("by_user_model", (q) => q.eq("userId", user._id))
        .take(MAX_RATINGS_PER_USER)
      if (existingRatings.length >= MAX_RATINGS_PER_USER)
        throw new ConvexError("Rating limit reached")
    }
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
    if (stats && (next.count > 0 || stars !== null)) {
      await ctx.db.patch(stats._id, next)
    } else if (stats) {
      // Last rating removed: drop the stats row instead of leaving a
      // zero-count zombie behind (same as clearUserRatings).
      await ctx.db.delete(stats._id)
    } else if (stars !== null) {
      await ctx.db.insert("modelStats", next)
    }
    if (stars === null) {
      if (previous) await ctx.db.delete(previous._id)
    } else if (previous) {
      await ctx.db.patch(previous._id, {
        stars,
        notes: normalizedNotes,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("ratings", {
        userId: user._id,
        modelId,
        stars,
        notes: normalizedNotes,
        updatedAt: now,
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
