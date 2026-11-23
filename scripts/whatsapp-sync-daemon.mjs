import fs from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";

const homeDir = process.env.USERPROFILE || process.env.HOME || "C:\\Users\\asus";
const tokenPath = path.join(homeDir, ".whatsapp-mcp", "whatsapp-token.json");

if (!fs.existsSync(tokenPath)) {
  console.error("whatsapp-token.json not found at:", tokenPath);
  process.exit(1);
}

const tokenData = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
const CONVEX_URL = "https://pastel-vulture-190.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

console.log("=================================================");
console.log("AUTOMATED WHATSAPP MESSAGE SYNC DAEMON STARTED");
console.log("Target Cloud: " + CONVEX_URL);
console.log("Watching for new messages every 10s...");
console.log("=================================================");

const processedMessages = new Set();

async function callMcp(name, args = {}) {
  const res = await fetch("https://whatsapp.finereli.com/mcp", {
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
  return await res.json();
}

async function syncCycle() {
  try {
    // 1. Sync store
    await callMcp("sync_now");

    // 2. Fetch latest messages from Zaid chat
    const res = await callMcp("get_messages", {
      chat: "919116203280@s.whatsapp.net",
      limit: 6,
    });

    if (res?.result?.content?.[0]?.text) {
      const rawText = res.result.content[0].text;
      const lines = rawText.split("\n").filter((l) => l.trim().length > 0);

      const existingInConvex = await client.query("tasks:listInboxMessages");
      for (const m of existingInConvex) {
        processedMessages.add(m.text.toLowerCase().trim());
      }

      for (const line of lines) {
        const match = line.match(/\[(.*?)\] (.*?): (.*)/);
        if (match) {
          const [, timeStr, sender, content] = match;
          const cleanText = content.trim();

          if (
            cleanText.startsWith("[") ||
            cleanText.length < 5 ||
            cleanText.toLowerCase() === "apinex"
          ) {
            continue;
          }

          const key = cleanText.toLowerCase().trim();
          if (!processedMessages.has(key)) {
            processedMessages.add(key);

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

            console.log(`[${new Date().toLocaleTimeString()}] NEW WHATSAPP TASK DETECTED:`);
            console.log(`  Sender:  ${sender}`);
            console.log(`  Message: "${cleanText}"`);
            console.log(`  Task:    "${taskCandidate}"`);
            console.log(`  Role:    ${role}`);

            await client.mutation("tasks:pushLiveWhatsAppMessage", {
              sender: sender === "Me" ? "You (WhatsApp Note)" : sender,
              text: cleanText,
              extractedTask: taskCandidate,
              suggestedRole: role,
              timestamp: Date.now(),
            });

            console.log(`  -> Synced to Convex production!`);
          }
        }
      }
    }
  } catch (err) {
    console.error("Sync error:", err.message);
  }
}

// Initial run
syncCycle();

// Polling interval
setInterval(syncCycle, 10000);
