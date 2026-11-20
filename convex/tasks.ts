import { query, mutation } from "./_generated/server";
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
    const createdAt = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      completed: false,
      deadline: args.deadline,
      createdAt,
      deadlineLastModified: createdAt,
    });

    if (args.deadline) {
      await ctx.scheduler.runAfter(0, internal.reminders.scheduleMilestonesForTask, {
        taskId,
        taskTitle: args.title,
        createdAt,
        deadline: args.deadline,
      });
    }
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

export const update = mutation({
  args: { 
    id: v.id("tasks"),
    title: v.string(),
    deadline: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return;

    const patch: { title: string; deadline?: number | null; deadlineLastModified?: number } = {
      title: args.title,
    };

    const newDeadline = args.deadline !== undefined ? args.deadline : task.deadline;
    if (args.deadline !== undefined && args.deadline !== task.deadline) {
      patch.deadline = args.deadline;
      patch.deadlineLastModified = Date.now();
    }

    await ctx.db.patch(args.id, patch);

    if (newDeadline) {
      await ctx.scheduler.runAfter(0, internal.reminders.scheduleMilestonesForTask, {
        taskId: args.id,
        taskTitle: args.title,
        createdAt: task.createdAt,
        deadline: newDeadline,
      });
    }
  },
});
