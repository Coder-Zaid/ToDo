const { ConvexHttpClient } = require("convex/browser");

const DEV_CONVEX_URL = "https://jovial-impala-287.convex.cloud";
const PROD_CONVEX_URL = "https://pastel-vulture-190.convex.cloud";

// Target dates based on IST (UTC + 5:30)
// Nov 25, 2026 18:00 IST = Nov 25, 2026 12:30 UTC
const nov25 = new Date("2026-11-25T12:30:00Z").getTime();
// Nov 26, 2026 18:00 IST = Nov 26, 2026 12:30 UTC
const nov26 = new Date("2026-11-26T12:30:00Z").getTime();
// Nov 28, 2026 23:59 IST = Nov 28, 2026 18:29 UTC
const nov28 = new Date("2026-11-28T18:29:00Z").getTime();
// Nov 29, 2026 18:00 IST = Nov 29, 2026 12:30 UTC
const nov29Meeting = new Date("2026-11-29T12:30:00Z").getTime();
// Dec 7, 2026 09:30 IST = Dec 7, 2026 04:00 UTC
const dec7Meity = new Date("2026-12-07T04:00:00Z").getTime();

const tasksToSchedule = [
  {
    title: "Finalize Neuvera entity type (LLP/Pvt Ltd) & DPIIT paperwork",
    deadline: nov25
  },
  {
    title: "Coordinate with Geeta Ma'am on hospital LOI outreach (AIIMS, Niloufer, Apollo)",
    deadline: nov26
  },
  {
    title: "Build & test Reel Intercept model with mascot nudges",
    deadline: nov28
  },
  {
    title: "Neuvera Core Team Meeting & Progress Review",
    deadline: nov29Meeting
  },
  {
    title: "Pitch Neuvera to Dr. Rajesh Kumar (MeitY Director) at Future Tech Summit",
    deadline: dec7Meity
  }
];

async function addTasksToConvex(url, label) {
  console.log(`Adding tasks to ${label} (${url})...`);
  const client = new ConvexHttpClient(url);
  for (const t of tasksToSchedule) {
    try {
      const id = await client.mutation("tasks:add", {
        title: t.title,
        deadline: t.deadline
      });
      console.log(` [${label}] Added: "${t.title}" -> ${id}`);
    } catch (err) {
      console.error(` [${label}] Error adding "${t.title}":`, err.message);
    }
  }
}

async function run() {
  await addTasksToConvex(DEV_CONVEX_URL, "DEV");
  await addTasksToConvex(PROD_CONVEX_URL, "PROD");
  console.log("All tasks scheduled successfully!");
}

run().catch(console.error);
