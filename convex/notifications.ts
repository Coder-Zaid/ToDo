"use node";

import { internalAction, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { sendNotification, setVapidDetails } from "web-push";

function configureVapid() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    "BFEhzWbuokU9sGjvvwXvJFlCd8PrQxHezlb1W1KgbGlRi_kWjX7cVcAM7WCaRc5Vxs-18Bt5wCZ8lPq5zwiHdqA";
  const privateKey =
    process.env.VAPID_PRIVATE_KEY ||
    "tdkV8ibtcxveW9xOKiEW3OZ_AFQJ21IfZ0M57K-9x0A";
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@blacktodo.app";

  setVapidDetails(subject, publicKey, privateKey);
}

export const sendPushAction = internalAction({
  args: {
    subscriptionId: v.id("push_subscriptions"),
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
    title: v.string(),
    body: v.string(),
    url: v.optional(v.string()),
    taskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, args) => {
    try {
      configureVapid();
      const convexSiteUrl =
        process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
        "https://pastel-vulture-190.convex.site";

      await sendNotification(
        {
          endpoint: args.endpoint,
          keys: {
            p256dh: args.p256dh,
            auth: args.auth,
          },
        },
        JSON.stringify({
          title: args.title,
          body: args.body,
          icon: "/notification-tick.png",
          badge: "/badge-tick.png",
          url: args.url || "/",
          taskId: args.taskId || null,
          convexSiteUrl,
        })
      );
      return { success: true };
    } catch (err: any) {
      console.error("Push delivery error for endpoint:", args.endpoint, err);
      // Clean up dead subscriptions
      if (err.statusCode === 404 || err.statusCode === 410) {
        await ctx.runMutation(internal.subscriptions.removeById, {
          id: args.subscriptionId,
        });
      }
      return { success: false, error: String(err) };
    }
  },
});

export const sendTestNotification = action({
  args: {
    endpoint: v.string(),
    p256dh: v.string(),
    auth: v.string(),
  },
  handler: async (_ctx, args) => {
    try {
      configureVapid();

      await sendNotification(
        {
          endpoint: args.endpoint,
          keys: {
            p256dh: args.p256dh,
            auth: args.auth,
          },
        },
        JSON.stringify({
          title: "ToDo Push Active",
          body: "Milestone reminders are enabled for your tasks!",
          icon: "/notification-tick.png",
          badge: "/badge-tick.png",
          url: "/",
        })
      );
      return { success: true };
    } catch (err: any) {
      console.error("Test push failed:", err);
      return { success: false, error: err.message || String(err) };
    }
  },
});
