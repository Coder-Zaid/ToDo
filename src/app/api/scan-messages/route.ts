import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import fs from "fs";
import path from "path";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://pastel-vulture-190.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

function getWhatsAppToken(): string | null {
  if (process.env.WHATSAPP_ACCESS_TOKEN) {
    return process.env.WHATSAPP_ACCESS_TOKEN;
  }
  // Try local token file
  const homeDir = process.env.USERPROFILE || process.env.HOME || "C:\\Users\\asus";
  const tokenPath = path.join(homeDir, ".whatsapp-mcp", "whatsapp-token.json");
  if (fs.existsSync(tokenPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
      return data.access_token || null;
    } catch (_) {}
  }
  return null;
}

export async function POST() {
  try {
    const token = getWhatsAppToken();
    if (!token) {
      return NextResponse.json({ success: false, reason: "WhatsApp token not configured" });
    }

    // 1. Trigger sync_now on WhatsApp MCP
    try {
      await fetch("https://whatsapp.finereli.com/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "sync_now", arguments: {} },
        }),
      });
    } catch (e) {
      console.warn("sync_now call warning:", e);
    }

    // 2. Fetch latest messages from user's personal chat
    const msgRes = await fetch("https://whatsapp.finereli.com/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "get_messages",
          arguments: { chat: "919116203280@s.whatsapp.net", limit: 5 },
        },
      }),
    });

    const msgData = await msgRes.json();
    let newTasksAdded = 0;

    if (msgData?.result?.content?.[0]?.text) {
      const rawText: string = msgData.result.content[0].text;
      const lines = rawText.split("\n").filter((l) => l.trim().length > 0);

      // Query current pending messages to prevent duplicate insertion
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existing: any[] = await client.query("tasks:listInboxMessages" as any);
      const existingTexts = new Set(existing.map((m) => m.text.toLowerCase()));

      for (const line of lines) {
        // Line format: [2026-11-23 10:35] Me: ...
        const match = line.match(/\[(.*?)\] (.*?): (.*)/);
        if (match) {
          const [, , sender, content] = match;
          const cleanContent = content.trim();

          // Skip stickers, media tags, or very short words
          if (
            cleanContent.startsWith("[") ||
            cleanContent.length < 5 ||
            cleanContent.toLowerCase() === "apinex"
          ) {
            continue;
          }

          if (!existingTexts.has(cleanContent.toLowerCase())) {
            // Determine suggested profile
            const lower = cleanContent.toLowerCase();
            let suggestedRole = "general";
            if (lower.includes("neuvera") || lower.includes("roadmap") || lower.includes("hospital")) {
              suggestedRole = "neuvera";
            } else if (lower.includes("itsprelude") || lower.includes("hackathon") || lower.includes("saree") || lower.includes("vton")) {
              suggestedRole = "itsprelude";
            } else if (lower.includes("enterprise") || lower.includes("kitchen") || lower.includes("forecast")) {
              suggestedRole = "enterprise";
            }

            // Extract candidate task title
            let taskCandidate = cleanContent;
            if (taskCandidate.toLowerCase().startsWith("please ")) {
              taskCandidate = taskCandidate.substring(7);
            }
            if (taskCandidate.toLowerCase().startsWith("can you ")) {
              taskCandidate = taskCandidate.substring(8);
            }

            // Capitalize first letter
            taskCandidate = taskCandidate.charAt(0).toUpperCase() + taskCandidate.slice(1);

            // Push to Convex
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await client.mutation("tasks:pushLiveWhatsAppMessage" as any, {
              sender: sender === "Me" ? "You (WhatsApp Note)" : sender,
              text: cleanContent,
              extractedTask: taskCandidate,
              suggestedRole,
              timestamp: Date.now(),
            });

            existingTexts.add(cleanContent.toLowerCase());
            newTasksAdded++;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      newTasksAdded,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    console.error("Error scanning messages:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
