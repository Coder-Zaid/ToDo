import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("tasks")
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    title: v.string(),
    deadline: v.union(v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("tasks", {
      title: args.title,
      completed: false,
      deadline: args.deadline,
      createdAt: Date.now(),
    });
  },
});

export const toggle = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (task) {
      const newCompleted = !task.completed;
      await ctx.db.patch(args.id, { completed: newCompleted });
      
      // If task is newly completed, schedule a cleanup delete in 30 secs
      if (newCompleted) {
         await ctx.scheduler.runAfter(30000, api.tasks.cleanup, { id: args.id });
      }
    }
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const cleanup = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    // Only delete if it's still completed (hasn't been unchecked)
    if (task && task.completed) {
      await ctx.db.delete(args.id);
    }
  },
});
