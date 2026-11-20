import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://pastel-vulture-190.convex.cloud";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const taskId = body.taskId;

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Missing taskId" },
        { status: 400 }
      );
    }

    const client = new ConvexHttpClient(convexUrl);
    const res = await client.mutation(api.tasks.completeTaskDirectly, {
      id: taskId as Id<"tasks">,
    });

    return NextResponse.json(res, { status: 200 });
  } catch (err: unknown) {
    console.error("Next.js task completion proxy error:", err);
    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}
