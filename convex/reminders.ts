import { internalMutation } from "./_generated/server";
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
  const milestones: ScheduledMilestone[] = [];
  const ONE_HOUR = 60 * 60 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  // Percentage checkpoints (33%, 50%, 70%) for tasks spaced at least 2 days apart
  if (totalDuration >= 2 * ONE_DAY) {
    const t33 = Math.round(createdAt + totalDuration * 0.33);
    const t50 = Math.round(createdAt + totalDuration * 0.50);
    const t70 = Math.round(createdAt + totalDuration * 0.70);
    const t24h = deadline - ONE_DAY;

    // 33% checkpoint: at least 1 min in the future and sufficiently before 24h warning
    if (t33 > now + 60_000 && t33 < t24h - 4 * ONE_HOUR) {
      milestones.push({
        time: t33,
        type: "33%",
        title: "33% Progress Milestone",
        body: `1/3 of the timeframe has elapsed for "${taskTitle}".`,
      });
    }

    // 50% checkpoint
    if (t50 > now + 60_000 && t50 < t24h - 4 * ONE_HOUR) {
      milestones.push({
        time: t50,
        type: "50%",
        title: "Halfway Milestone (50%)",
        body: `Halfway point reached for "${taskTitle}".`,
      });
    }

    // 70% checkpoint
    if (t70 > now + 60_000 && t70 < t24h - 4 * ONE_HOUR) {
      milestones.push({
        time: t70,
        type: "70%",
        title: "70% Milestone Notice",
        body: `70% of the timeframe has passed for "${taskTitle}".`,
      });
    }
  }

  // 24 Hours Before Reminder
  const t24h = deadline - ONE_DAY;
  if (t24h > now + 60_000 && totalDuration > ONE_DAY + 60_000) {
    milestones.push({
      time: t24h,
      type: "24h",
      title: "Due Tomorrow (24h Reminder)",
      body: `"${taskTitle}" is due in 24 hours.`,
    });
  }

  // Exact Deadline
  if (deadline > now + 10_000) {
    milestones.push({
      time: deadline,
      type: "due",
      title: "Task Due Now",
      body: `"${taskTitle}" is due now!`,
    });
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
    const milestones = computeMilestones(args.taskTitle, args.createdAt, args.deadline);

    for (const m of milestones) {
      await ctx.scheduler.runAt(m.time, internal.reminders.triggerMilestone, {
        taskId: args.taskId,
        scheduledDeadline: args.deadline,
        type: m.type,
        title: m.title,
        body: m.body,
      });
    }
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
    const task = await ctx.db.get(args.taskId);

    // If task was deleted or marked done, skip
    if (!task || task.completed) {
      return;
    }

    // If deadline was changed since this milestone was scheduled, skip stale trigger
    if (task.deadline !== args.scheduledDeadline) {
      return;
    }

    const subscriptions = await ctx.db.query("push_subscriptions").collect();

    for (const sub of subscriptions) {
      await ctx.scheduler.runAfter(0, internal.notifications.sendPushAction, {
        subscriptionId: sub._id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        title: args.title,
        body: args.body,
        url: "/",
      });
    }
  },
});
