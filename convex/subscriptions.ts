import { mutation, query, internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const save = mutation({
  args: {
    endpoint: v.string(),
    keys: v.object({
      p256dh: v.string(),
      auth: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        keys: args.keys,
      });
      return existing._id;
    }

    return await ctx.db.insert("push_subscriptions", {
      endpoint: args.endpoint,
      keys: args.keys,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const isSubscribed = query({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    if (!args.endpoint) return false;
    const existing = await ctx.db
      .query("push_subscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();
    return !!existing;
  },
});

export const listInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("push_subscriptions").collect();
  },
});

export const removeById = internalMutation({
  args: {
    id: v.id("push_subscriptions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
