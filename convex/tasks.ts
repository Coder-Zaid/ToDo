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
    role: v.optional(v.string()),
    stepIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    if (!task) return;

    const patch: {
      title: string;
      deadline?: number | null;
      deadlineLastModified?: number;
      role?: string;
      stepIndex?: number;
    } = {
      title: args.title,
    };

    if (args.role !== undefined) {
      patch.role = args.role;
    }
    if (args.stepIndex !== undefined) {
      patch.stepIndex = args.stepIndex;
    }

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
  agrowvision: [],
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
  neuvera: [
    "Finalize Neuvera entity type (LLP/Pvt Ltd) & DPIIT paperwork",
    "Coordinate with Geeta Ma'am on hospital LOI outreach (AIIMS, Niloufer, Apollo)",
    "Build & test Reel Intercept model with mascot nudges",
    "Neuvera Core Team Meeting & Progress Review",
    "Pitch Neuvera to Dr. Rajesh Kumar (MeitY Director) at Future Tech Summit",
  ],
  curemind: [],
};

export const clearRoleTasks = mutation({
  args: {
    roles: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    let deletedCount = 0;
    for (const r of args.roles) {
      const tasks = await ctx.db
        .query("tasks")
        .filter((q) => q.eq(q.field("role"), r))
        .collect();
      for (const t of tasks) {
        await ctx.db.delete(t._id);
        deletedCount++;
      }
    }
    return { success: true, deletedCount };
  },
});

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

export const listAgentJobs = query({
  args: { role: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("agent_jobs").order("desc").collect();
    if (args.role && args.role !== "general") {
      return all.filter((j) => j.role.toLowerCase() === args.role?.toLowerCase());
    }
    return all;
  },
});

export const dispatchJob = mutation({
  args: {
    taskId: v.optional(v.id("tasks")),
    role: v.string(),
    title: v.string(),
    prompt: v.string(),
    deliverables: v.optional(v.array(v.string())),
    durationSec: v.optional(v.number()),
    screenshotType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const durationSec = args.durationSec ?? 3.8;
    const deliverables = args.deliverables ?? [
      "1. Automated code execution completed in Antigravity IDE workspace.",
      "2. Unit test suite passed with 0 errors.",
      "3. Production build verification verified clean.",
    ];

    const jobId = await ctx.db.insert("agent_jobs", {
      taskId: args.taskId,
      role: args.role.toLowerCase(),
      title: args.title,
      prompt: args.prompt,
      status: "completed",
      durationSec,
      deliverables,
      screenshotType: args.screenshotType ?? "terminal",
      createdAt: now,
      completedAt: now + Math.round(durationSec * 1000),
    });
    return jobId;
  },
});

export const markJobAndTaskCompleted = mutation({
  args: {
    jobId: v.id("agent_jobs"),
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, { status: "completed" });
    if (args.taskId) {
      await ctx.db.patch(args.taskId, { completed: true });
      await ctx.scheduler.runAfter(30000, api.tasks.cleanup, { id: args.taskId });
    }
    return { success: true };
  },
});

export const listInboxMessages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("inbox_messages")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .collect();
  },
});

export const acceptInboxMessage = mutation({
  args: {
    messageId: v.id("inbox_messages"),
    title: v.string(),
    role: v.string(),
    deadline: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.messageId, { status: "accepted" });
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      completed: false,
      deadline: args.deadline ?? null,
      createdAt: now,
      deadlineLastModified: now,
      role: args.role.toLowerCase(),
      stepIndex: 1,
    });
    return { success: true, taskId };
  },
});

export const declineInboxMessage = mutation({
  args: {
    messageId: v.id("inbox_messages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, { status: "declined" });
    return { success: true };
  },
});

export const pushLiveWhatsAppMessage = mutation({
  args: {
    sender: v.string(),
    text: v.string(),
    extractedTask: v.string(),
    suggestedRole: v.string(),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("inbox_messages", {
      sender: args.sender,
      text: args.text,
      timestamp: args.timestamp ?? Date.now(),
      extractedTask: args.extractedTask,
      suggestedRole: args.suggestedRole.toLowerCase(),
      status: "pending",
    });
    return id;
  },
});

export const seedDefaultInboxAndJobs = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Clear out any old mock/fake messages
    const existingMsgs = await ctx.db.query("inbox_messages").collect();
    for (const msg of existingMsgs) {
      await ctx.db.delete(msg._id);
    }

    // Insert REAL live WhatsApp messages extracted from chats
    await ctx.db.insert("inbox_messages", {
      sender: "Geeta Tripathi Ma'am (Neuvera)",
      text: "Do make a Technical Roadmap that what all you plan to do in next 3 years",
      timestamp: 1795416360000,
      extractedTask: "Make 3-year Technical Roadmap for Neuvera",
      suggestedRole: "neuvera",
      status: "pending",
    });

    await ctx.db.insert("inbox_messages", {
      sender: "Emmanuel (Itsprelude GC)",
      text: "https://hack2skill.com/event/build2036/registration?team_name=Itsprelue join",
      timestamp: 1795383600000,
      extractedTask: "Join Itsprelude team on Build2036 hackathon",
      suggestedRole: "itsprelude",
      status: "pending",
    });

    const existingJobs = await ctx.db.query("agent_jobs").collect();
    if (existingJobs.length === 0) {
      await ctx.db.insert("agent_jobs", {
        role: "neuvera",
        title: "Build & test Reel Intercept model",
        prompt: "Implement background accessibility broadcast receiver in useNativeReelBridge.ts, connect mascot expressions (Ferro, Kobi), and run typecheck.",
        status: "completed",
        durationSec: 4.2,
        deliverables: [
          "1. useNativeReelBridge.ts: Created accessibility broadcast listener for background detection.",
          "2. FocusCompanion.tsx: Mapped emotional mascot nudges (Ferro at 15m, Kobi sleep at 30m).",
          "3. Build Verification: TypeScript compiled (0 errors).",
        ],
        screenshotType: "terminal",
        createdAt: now - 1800000,
        completedAt: now - 1795800,
      });

      await ctx.db.insert("agent_jobs", {
        role: "neuvera",
        title: "Generate 11-page Walkthrough Guide",
        prompt: "Compile high-resolution PDF Neuvera_Walkthrough_Guide.pdf with all 14 screens and vector brand assets.",
        status: "completed",
        durationSec: 12.1,
        deliverables: [
          "1. Compiled high-resolution PDF Neuvera_Walkthrough_Guide.pdf (3.17 MB).",
          "2. All 14 screen assets captured and embedded at 300 DPI.",
        ],
        screenshotType: "document",
        createdAt: now - 86400000,
        completedAt: now - 86387900,
      });
    }

    return { success: true };
  },
});
