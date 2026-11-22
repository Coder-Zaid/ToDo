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
    role: v.optional(v.string()),
    stepIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const createdAt = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      completed: false,
      deadline: args.deadline,
      createdAt,
      deadlineLastModified: createdAt,
      role: args.role ?? "general",
      stepIndex: args.stepIndex,
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

export const completeTaskDirectly = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (task && !task.completed) {
      await ctx.db.patch(args.id, { completed: true });
      // Schedule automatic cleanup in 30 seconds
      await ctx.scheduler.runAfter(30000, api.tasks.cleanup, { id: args.id });
      return { success: true, title: task.title };
    }
    return { success: false, reason: "Already completed or not found" };
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

export const DEFAULT_ROLE_ROADMAPS: Record<string, string[]> = {
  agrowvision: [
    "Run mechanical dewatering trials to benchmark dry fiber yield per 100kg wet hyacinth",
    "Test semi-chemical digest vs enzymatic maceration for tensile strength & burst factor",
    "Produce trial batch of thermoformed biodegradable trays & measure water absorption (Cobb test)",
    "Compile Technical Data Sheet (TDS) & unit economics model per kg dry pulp",
  ],
  itsprelude: [
    "Benchmark CatVTON & IDM-VTON on RunPod with sample person & saree fabric textures",
    "Implement SCHP / DensePose garment segmentation to isolate torso, limbs & drape contours",
    "Configure IP-Adapter-Plus with ControlNet (OpenPose + SoftEdge) for saree weave preservation",
    "Build FastAPI inference pipeline accepting person_img and saree_pattern",
  ],
  enterprise: [
    "Draft Recipe-to-Ingredient consumption mapping schema and historical sales query",
    "Build rolling 7-day & 28-day sales velocity forecasting model with day-of-week seasonality",
    "Implement Reorder Point (ROP) & dynamic safety stock calculation to prevent stockouts",
    "Design executive kitchen dashboard alerts for top rush items and suggested restock orders",
  ],
  curemind: [
    "Attend Neuvera stakeholder meeting & document signal modality (EEG/fMRI) & architecture scope",
    "Define Spiking Neural Network (LIF SNN) or sequence model pipeline based on meeting specs",
  ],
};

export const seedRoleMilestones = mutation({
  args: {
    role: v.optional(v.string()),
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const rolesToSeed = args.role
      ? [args.role]
      : Object.keys(DEFAULT_ROLE_ROADMAPS);

    const now = Date.now();
    let totalInserted = 0;

    for (const r of rolesToSeed) {
      const steps = DEFAULT_ROLE_ROADMAPS[r];
      if (!steps) continue;

      const existing = await ctx.db
        .query("tasks")
        .filter((q) => q.eq(q.field("role"), r))
        .collect();

      if (existing.length > 0 && !args.force) {
        continue;
      }

      for (let i = 0; i < steps.length; i++) {
        await ctx.db.insert("tasks", {
          title: steps[i],
          completed: false,
          deadline: null,
          createdAt: now + i * 10,
          deadlineLastModified: now + i * 10,
          role: r,
          stepIndex: i + 1,
        });
        totalInserted++;
      }
    }

    return { success: true, count: totalInserted };
  },
});
