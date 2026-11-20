import { internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { parseTaskFromText } from "./parser";

export const createTaskFromMessage = internalMutation({
  args: {
    text: v.string(),
    fromNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const parsed = parseTaskFromText(args.text);
    if (!parsed.title) {
      return { success: false, reason: "Empty message" };
    }

    const createdAt = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      title: parsed.title,
      completed: false,
      deadline: parsed.deadline,
      createdAt,
      deadlineLastModified: createdAt,
    });

    // Schedule milestone reminders if deadline exists
    if (parsed.deadline) {
      await ctx.scheduler.runAfter(0, internal.reminders.scheduleMilestonesForTask, {
        taskId,
        taskTitle: parsed.title,
        createdAt,
        deadline: parsed.deadline,
      });
    }

    // If sender number is known, send WhatsApp confirmation reply
    if (args.fromNumber) {
      const deadlineStr = parsed.deadline
        ? new Date(parsed.deadline).toLocaleString()
        : "No deadline";

      const replyText = `✅ Task created: "${parsed.title}"\n⏰ Deadline: ${deadlineStr}`;

      await ctx.scheduler.runAfter(0, internal.whatsapp.sendWhatsAppReply, {
        toNumber: args.fromNumber,
        message: replyText,
      });
    }

    return {
      success: true,
      taskId,
      title: parsed.title,
      deadline: parsed.deadline,
    };
  },
});

export const sendWhatsAppReply = internalAction({
  args: {
    toNumber: v.string(),
    message: v.string(),
  },
  handler: async (_ctx, args) => {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      // Reply credentials not configured yet, task is still saved
      return { success: false, reason: "WhatsApp credentials not set" };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: args.toNumber,
            type: "text",
            text: { body: args.message },
          }),
        }
      );

      const data = await response.json();
      return { success: response.ok, data };
    } catch (err: unknown) {
      console.error("WhatsApp reply failed:", err);
      return { success: false, error: String(err) };
    }
  },
});
