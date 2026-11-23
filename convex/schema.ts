import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    title: v.string(),
    completed: v.boolean(),
    deadline: v.union(v.number(), v.null()),
    createdAt: v.number(),
    deadlineLastModified: v.optional(v.number()),
    role: v.optional(v.string()), // "general" | "agrowvision" | "itsprelude" | "neuvera" | "enterprise"
    stepIndex: v.optional(v.number()),
    isAgentActionable: v.optional(v.boolean()),
  }),
  agent_jobs: defineTable({
    taskId: v.optional(v.id("tasks")),
    role: v.string(),
    title: v.string(),
    prompt: v.string(),
    status: v.string(), // "queued" | "running" | "completed" | "failed"
    durationSec: v.optional(v.number()),
    deliverables: v.optional(v.array(v.string())),
    screenshotUrl: v.optional(v.string()),
    screenshotType: v.optional(v.string()), // "terminal" | "document" | "ui"
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_role", ["role"]),
  inbox_messages: defineTable({
    sender: v.string(),
    text: v.string(),
    timestamp: v.number(),
    extractedTask: v.string(),
    suggestedRole: v.string(),
    status: v.string(), // "pending" | "accepted" | "declined"
  }).index("by_status", ["status"]),
  push_subscriptions: defineTable({
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
    createdAt: v.number(),
  }).index("by_endpoint", ["endpoint"]),
});
