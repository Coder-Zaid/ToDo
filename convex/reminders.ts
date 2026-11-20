import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export type MilestoneType = "33%" | "50%" | "70%" | "24h" | "due";

export interface ScheduledMilestone {
  time: number;
  type: MilestoneType;
  title: string;
  body: string;
}

export function computeMilestones(
  taskTitle: string,
  createdAt: number,
  deadline: number
): ScheduledMilestone[] {
  const now = Date.now();
  if (deadline <= now) return [];

  const totalDuration = deadline - createdAt;
  if (totalDuration <= 0) return [];

  const rawMilestones: ScheduledMilestone[] = [];
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  // 1. Percentage checkpoints (33%, 50%, 70%)
  // Applicable for any task duration (works for 10-min tests and 1-month projects alike)
  const t33 = Math.round(createdAt + totalDuration * 0.33);
  const t50 = Math.round(createdAt + totalDuration * 0.50);
  const t70 = Math.round(createdAt + totalDuration * 0.70);

  if (t33 > now + 1000 && t33 < deadline - 2000) {
    rawMilestones.push({
      time: t33,
      type: "33%",
      title: "33% Progress Milestone",
      body: `1/3 of the timeframe has elapsed for "${taskTitle}".`,
    });
  }

  if (t50 > now + 1000 && t50 < deadline - 2000) {
    rawMilestones.push({
      time: t50,
      type: "50%",
      title: "Halfway Milestone (50%)",
      body: `Halfway point reached for "${taskTitle}".`,
    });
  }

  if (t70 > now + 1000 && t70 < deadline - 2000) {
    rawMilestones.push({
      time: t70,
      type: "70%",
      title: "70% Milestone Notice",
      body: `70% of the timeframe has passed for "${taskTitle}".`,
    });
  }

  // 2. 24 Hours Before Reminder
  // Only applicable if the task duration was originally longer than 24 hours
  const t24h = deadline - ONE_DAY;
  if (totalDuration > ONE_DAY && t24h > now + 1000) {
    rawMilestones.push({
      time: t24h,
      type: "24h",
      title: "Due Tomorrow (24h Reminder)",
      body: `"${taskTitle}" is due in 24 hours.`,
    });
  }

  // 3. Exact Deadline (Due now)
  if (deadline > now + 1000) {
    rawMilestones.push({
      time: deadline,
      type: "due",
      title: "Task Due Now",
      body: `"${taskTitle}" is due now!`,
    });
  }

  // Sort by execution time
  rawMilestones.sort((a, b) => a.time - b.time);

  // Deduplicate any milestones that fall within 2 seconds of each other
  const milestones: ScheduledMilestone[] = [];
  for (const m of rawMilestones) {
    const isDuplicate = milestones.some(
      (existing) => Math.abs(existing.time - m.time) < 2000
    );
    if (!isDuplicate) {
      milestones.push(m);
    }
  }

  return milestones;
}

export const scheduleMilestonesForTask = internalMutation({
  args: {
    taskId: v.id("tasks"),
    taskTitle: v.string(),
    createdAt: v.number(),
    deadline: v.number(),
  },
  handler: async (ctx, args) => {
    const milestones = computeMilestones(
      args.taskTitle,
      args.createdAt,
      args.deadline
    );

    for (const m of milestones) {
      await ctx.scheduler.runAt(m.time, internal.reminders.triggerMilestone, {
        taskId: args.taskId,
        scheduledDeadline: args.deadline,
        type: m.type,
        title: m.title,
        body: m.body,
      });
    }

    return { scheduledCount: milestones.length, milestones };
  },
});

export const triggerMilestone = internalMutation({
  args: {
    taskId: v.id("tasks"),
    scheduledDeadline: v.number(),
    type: v.string(),
    title: v.string(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(
      `[Reminders] Triggering ${args.type} milestone for task: "${args.title}"`
    );
    const task = await ctx.db.get(args.taskId);

    // If task was deleted or marked done, skip
    if (!task || task.completed) {
      console.log(`[Reminders] Task is completed or deleted. Skipping.`);
      return;
    }

    // If deadline was changed since this milestone was scheduled, skip stale trigger
    if (task.deadline !== args.scheduledDeadline) {
      console.log(`[Reminders] Deadline changed. Skipping stale trigger.`);
      return;
    }

    const subscriptions = await ctx.db.query("push_subscriptions").collect();
    console.log(`[Reminders] Found ${subscriptions.length} active subscriptions`);

    for (const sub of subscriptions) {
      await ctx.scheduler.runAfter(0, internal.notifications.sendPushAction, {
        subscriptionId: sub._id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        title: args.title,
        body: args.body,
        url: "/",
        taskId: args.taskId,
      });
    }
  },
});

// Reschedule all active, incomplete tasks with deadlines (useful for migrations/bugfixes)
export const rescheduleAllActiveTasks = mutation({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    let rescheduled = 0;

    for (const task of tasks) {
      if (!task.completed && task.deadline && task.deadline > Date.now()) {
        await ctx.scheduler.runAfter(
          0,
          internal.reminders.scheduleMilestonesForTask,
          {
            taskId: task._id,
            taskTitle: task.title,
            createdAt: task.createdAt,
            deadline: task.deadline,
          }
        );
        rescheduled++;
      }
    }

    return { rescheduled };
  },
});
