import fs from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";

const homeDir = process.env.USERPROFILE || process.env.HOME || "C:\\Users\\asus";
const tokenPath = path.join(homeDir, ".whatsapp-mcp", "whatsapp-token.json");

if (!fs.existsSync(tokenPath)) {
  console.error("whatsapp-token.json not found at:", tokenPath);
  process.exit(1);
}

let tokenData = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
const CONVEX_URL = "https://pastel-vulture-190.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("=================================================");
console.log("LIVE WHATSAPP SYNC DAEMON ACTIVE");
console.log("Convex Cloud: " + CONVEX_URL);
console.log("Polling interval: 6 seconds");
console.log("=================================================");

async function refreshToken() {
  if (!tokenData.refresh_token) return null;
  const authHeader = "Basic " + Buffer.from(tokenData.client_id + ":" + tokenData.client_secret).toString("base64");
  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: tokenData.refresh_token,
    client_id: tokenData.client_id,
  });

  try {
    const res = await fetch("https://whatsapp.finereli.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: authHeader,
      },
      body: params.toString(),
    });
    const newData = await res.json();
    if (newData.access_token) {
      tokenData.access_token = newData.access_token;
      if (newData.refresh_token) tokenData.refresh_token = newData.refresh_token;
      fs.writeFileSync(tokenPath, JSON.stringify(tokenData, null, 2));
      return newData.access_token;
    }
  } catch (e) {
    console.error("Token refresh failed:", e.message);
  }
  return null;
}

async function callMcp(name, args = {}) {
  let res = await fetch("https://whatsapp.finereli.com/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      Authorization: `Bearer ${tokenData.access_token}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });

  let data = await res.json();
  if (data?.error && (data.error === "invalid_token" || data.error?.message?.includes("token"))) {
    const newToken = await refreshToken();
    if (newToken) {
      res = await fetch("https://whatsapp.finereli.com/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
          Authorization: `Bearer ${newToken}`,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method: "tools/call",
          params: { name, arguments: args },
        }),
      });
      data = await res.json();
    }
  }
  return data;
}

let isRunning = false;
let lastSyncedText = "";

async function syncCycle() {
  if (isRunning) return;
  isRunning = true;

  try {
    // 1. Sync store (with timeout guard)
    const syncPromise = callMcp("sync_now");
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000));
    await Promise.race([syncPromise, timeoutPromise]).catch(() => {});

    // 2. Fetch latest messages from Zaid chat
    const res = await callMcp("get_messages", {
      chat: "919116203280@s.whatsapp.net",
      limit: 3,
    });

    if (res?.result?.content?.[0]?.text) {
      const rawText = res.result.content[0].text;
      const lines = rawText.split("\n").filter((l) => l.trim().length > 0);

      for (const line of lines) {
        const match = line.match(/\[(.*?)\] (.*?): (.*)/);
        if (match) {
          const [, , sender, content] = match;
          const cleanText = content.trim();

          if (
            cleanText.startsWith("[") ||
            cleanText.length < 5 ||
            cleanText.toLowerCase() === "apinex"
          ) {
            continue;
          }

          if (cleanText !== lastSyncedText) {
            // Check if already in Convex
            const existing = await client.query("tasks:listInboxMessages");
            const alreadyExists = existing.some(
              (m) => m.text.toLowerCase().trim() === cleanText.toLowerCase().trim()
            );

            if (!alreadyExists) {
              lastSyncedText = cleanText;

              let role = "general";
              const lower = cleanText.toLowerCase();
              if (lower.includes("neuvera") || lower.includes("roadmap") || lower.includes("hospital")) {
                role = "neuvera";
              } else if (lower.includes("itsprelude") || lower.includes("hackathon") || lower.includes("saree") || lower.includes("vton")) {
                role = "itsprelude";
              } else if (lower.includes("enterprise") || lower.includes("kitchen") || lower.includes("forecast")) {
                role = "enterprise";
              }

              let taskCandidate = cleanText;
              if (taskCandidate.toLowerCase().startsWith("please ")) {
                taskCandidate = taskCandidate.substring(7);
              }
              if (taskCandidate.toLowerCase().startsWith("can you ")) {
                taskCandidate = taskCandidate.substring(8);
              }
              taskCandidate = taskCandidate.charAt(0).toUpperCase() + taskCandidate.slice(1);

              console.log(`[${new Date().toLocaleTimeString()}] INGESTING NEW WHATSAPP MESSAGE:`);
              console.log(`  "${cleanText}" -> Task: "${taskCandidate}" (${role})`);

              await client.mutation("tasks:pushLiveWhatsAppMessage", {
                sender: sender === "Me" ? "You (WhatsApp Note)" : sender,
                text: cleanText,
                extractedTask: taskCandidate,
                suggestedRole: role,
                timestamp: Date.now(),
              });
              console.log(`  -> Pushed to Convex!`);
            }
          }
        }
      }
    }
  } catch (err) {
    // Silent catch so loop continues
  } finally {
    isRunning = false;
  }
}

// Initial sync
syncCycle();

// Polling interval: every 6s
setInterval(syncCycle, 6000);
