import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const http = httpRouter();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "black-todo-secret";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// CORS preflight for task completion
http.route({
  path: "/api/tasks/complete",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }),
});

// 1. Meta Webhook Verification (GET)
http.route({
  path: "/api/whatsapp",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge || "", {
        status: 200,
        headers: { "Content-Type": "text/plain", ...corsHeaders },
      });
    }

    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }),
});

// 2. Incoming WhatsApp Message Handler (POST)
http.route({
  path: "/api/whatsapp",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = await request.json();

      // Check if it's a direct JSON API request
      if (body.text) {
        if (body.secret && body.secret !== VERIFY_TOKEN) {
          return new Response("Unauthorized", {
            status: 401,
            headers: corsHeaders,
          });
        }

        const res = await ctx.runMutation(
          internal.whatsapp.createTaskFromMessage,
          { text: body.text }
        );

        return new Response(JSON.stringify(res), {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Meta WhatsApp Cloud API Webhook payload
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];

      if (message && message.type === "text") {
        const text = message.text.body;
        const fromNumber = message.from;

        await ctx.runMutation(internal.whatsapp.createTaskFromMessage, {
          text,
          fromNumber,
        });
      }

      // Always acknowledge Meta with 200 OK
      return new Response("EVENT_RECEIVED", {
        status: 200,
        headers: corsHeaders,
      });
    } catch (err: unknown) {
      console.error("Webhook processing error:", err);
      return new Response("ERROR", { status: 200, headers: corsHeaders });
    }
  }),
});

// 3. Mark Task as Completed directly from Notification Action (POST)
http.route({
  path: "/api/tasks/complete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = await request.json();
      if (!body.taskId) {
        return new Response(
          JSON.stringify({ success: false, error: "Missing taskId" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const res = await ctx.runMutation(api.tasks.completeTaskDirectly, {
        id: body.taskId,
      });

      return new Response(JSON.stringify(res), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (err: unknown) {
      console.error("Complete task error:", err);
      return new Response(
        JSON.stringify({ success: false, error: String(err) }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  }),
});

export default http;
