import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  ratings: defineTable({
    userId: v.string(),
    modelId: v.string(),
    stars: v.number(),
    notes: v.optional(v.string()),
    updatedAt: v.number(),
  }).index("by_user_model", ["userId", "modelId"]),
  modelStats: defineTable({
    modelId: v.string(),
    count: v.number(),
    total: v.number(),
    distribution: v.array(v.number()),
  }).index("by_model", ["modelId"]),
})
