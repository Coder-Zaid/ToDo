import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    completed: v.boolean(),
    deadline: v.union(v.number(), v.null()),
    createdAt: v.number(),
    deadlineLastModified: v.optional(v.number()),
  }),
  push_subscriptions: defineTable({
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    createdAt: v.number(),
  }).index("by_endpoint", ["endpoint"]),
});
