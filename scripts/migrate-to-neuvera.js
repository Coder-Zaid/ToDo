const { ConvexHttpClient } = require("convex/browser");

const DEV_CONVEX_URL = "https://jovial-impala-287.convex.cloud";
const PROD_CONVEX_URL = "https://pastel-vulture-190.convex.cloud";

const TASK_MAP = [
  { match: "Finalize Neuvera entity type", stepIndex: 1 },
  { match: "Coordinate with Geeta Ma'am", stepIndex: 2 },
  { match: "Build & test Reel Intercept", stepIndex: 3 },
  { match: "Neuvera Core Team Meeting", stepIndex: 4 },
  { match: "Pitch Neuvera to Dr. Rajesh Kumar", stepIndex: 5 },
];

async function migrate(url, label) {
  console.log(`Migrating tasks in ${label} (${url})...`);
  const client = new ConvexHttpClient(url);
  const tasks = await client.query("tasks:list");

  for (const item of TASK_MAP) {
    const found = tasks.filter((t) => t.title.includes(item.match));
    for (const t of found) {
      await client.mutation("tasks:update", {
        id: t._id,
        title: t.title,
        deadline: t.deadline,
        role: "neuvera",
        stepIndex: item.stepIndex,
      });
      console.log(` [${label}] Updated "${t.title}" -> role: neuvera, stepIndex: ${item.stepIndex}`);
    }
  }
}

async function run() {
  await migrate(DEV_CONVEX_URL, "DEV");
  await migrate(PROD_CONVEX_URL, "PROD");
  console.log("Migration complete!");
}

run().catch(console.error);
